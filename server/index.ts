import { Pool } from "pg";
import { POSTGRESQL_CREDENTIALS }  from './secrets.js';
import * as CONSTANTS from './const.js'
import { createServer } from "http";
import { DisconnectReason, Server, Socket } from "socket.io";
import { callbackify } from "util";
const pool = new Pool(POSTGRESQL_CREDENTIALS);
pool.on('error', (err, client) =>{
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});
const wikiApiRoot: string = CONSTANTS.WIKI_API_ROOT;
const roomCodeLength: number = CONSTANTS.ROOM_ID_LENGTH;
const defaultParams: QueryParams = CONSTANTS.DEFAULT_PARAMS;

// outbound events
// io.on("gameCreated", () => {})
// io.on("gameStarted", () => {})
// io.on("sentArticleOptions", (options) => {
//   console.log(options);
// });
// io.on("activeArticleUpdated", () => {})
// io.on("scoreUpdated", () => {})
// io.on("roundUpdated", () => {})
// io.on("interrogatorUpdated", () => {})
// io.on("playerJoined", () => {})
// io.on("playerKicked", () => {})
// io.on("playerPromoted", () => {})
// io.on("playerGuessed", () => {})
// io.on("youAreInterrogator", () => {})
// io.on("youAreNotInterrogator",() => {})
// io.on("youAreHonest", () => {})
// io.on("youAreNotHonest",() => {})

io.on("connection", (socket: Socket) => {
    console.log('Socket has connected');
    console.log(socket.id);
    // inbound events
    socket.on("disconnect", (reason: DisconnectReason) => {
        console.log('Socket has disconnected');
    });
    socket.on("createGame", async (options, player: Player) => {
        const roomCode = await createNewGame(options, player, socket);
        io.to(socket.id).emit("gameCreated", roomCode);
        console.log("gameCreated: "+roomCode);
    });
    socket.on("joinGame", async (roomCode: string, player: Player) => {
        const playerId = await addPlayerToGame(roomCode, player);
        io.to(roomCode).emit("playerJoined", playerId)
    });
    socket.on("startGame", (roomCode: string) => {
        io.to(roomCode).emit("gameStarted");
    });
    socket.on("leaveGame", async () => {
        const playerId: number = await getPlayerIdFromSocketId(socket.id);
        await deletePlayerFromDatabase(playerId);
        const gameId: number = await getGameIdFromPlayerId(playerId);
        const gameEmpty: boolean = await isGameEmpty(gameId);
        if( gameEmpty ) { await deleteGameFromDatabase(gameId); };
    });
    socket.on("endGame", async (roomCode: string) => {
        const gameId: number = await getGameIdFromRoomCode(roomCode);
        await deleteGameFromDatabase(gameId);
        io.to(roomCode).emit("gameEnded");
    });
    socket.on("guessPlayer", (player: Player) => {
    });
    socket.on("promotePlayerToHost", async () => {
        const playerId: number = await getPlayerIdFromSocketId(socket.id);
        const gameId = await getGameIdFromPlayerId(playerId)
        await setPlayerHost(gameId, playerId, true)
    });
    socket.on("selectArticle", async (article: Article) => {
        const playerId = await getPlayerIdFromSocketId(socket.id);
        let oldArticleId : number | undefined;
        oldArticleId = await getArticleIdFromPlayerId(playerId)
        if(oldArticleId !== undefined){ await deleteArticleFromDatabase(oldArticleId); };
        await addArticleToDatabase(playerId, article);
    });
    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});

async function initPlayer(roomCode: string, player: Player) {
    await addPlayerToGame(roomCode, player);
    generatePlayerArticles(player);
};

httpServer.listen(3666);

interface QueryParams {
    action: string;
    format: string;
    list: string;
    rnlimit: number;
    rnnamespace: number;
}
interface WikiQueryResults{
    batchcomplete: string;
    continue: object;
    query;
}
interface Article {
    id: number;
    title: string;
}

interface Game {
    id: number;
    roomCode: string;
    maxScore: number;
    maxArticles: number;
    maxRounds: number;
    currentRound: number;
    createdAt: EpochTimeStamp;
}
interface GameOptions {
    maxScore: number;
    maxArticles: number;
    maxRounds: number;
}
interface Player {
    socket: Socket;
    screenname: string;
}
const defaultOptions: GameOptions = {
    maxScore: 10,
    maxArticles: 3,
    maxRounds: 5,
}

function generateRoomCode(length: number): string {
    let results: string = '';
    for (let i = 0; i < length; i++) {
        const randomIndex: number = Math.floor(Math.random() * CONSTANTS.CHARACTERS.length);
        results += CONSTANTS.CHARACTERS.charAt(randomIndex);
    }
    return results;
}
function stringifyWikiQuery(params: QueryParams): string {
    let url: string = wikiApiRoot + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];})
    return url;
}
async function fetchRandomArticle(): Promise<WikiQueryResults> {
    const response: Response = await fetch(stringifyWikiQuery(defaultParams));
    const wikiQueryResults: WikiQueryResults = await response.json();
    const randomResults = wikiQueryResults.query.random[0];
    return randomResults;
}
async function stripQueryToRows(results){
    return results.rows;
}
async function queryDatabase(query: string, values?: Array<any>): Promise<Array<any>>{
    const client = await pool.connect();
    let res: Promise<any>;
    if (typeof values !== 'undefined') {
        res = await pool.query(query, values);
    } else {
        res = await pool.query(query);
    }
    client.release();
    res = await stripQueryToRows(res)
    return res;
}
async function createUniqueRoomCode(): Promise<string>{
    const query: string = "SELECT EXISTS (SELECT * FROM games WHERE room_code = $1)";
    let values: Array<any>;
    let roomCode: string;
    let roomCollision: boolean;
    do { 
        roomCode = generateRoomCode(roomCodeLength);
        values = [roomCode];
        const res = await queryDatabase(query, values);
        roomCollision = res[0].exists;
    } while (roomCollision);
    return roomCode;
}
async function getGameMaxScore(gameId: number): Promise<number>{
    const query: string = "SELECT max_score FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_score;
}
async function getGameMaxArticles(gameId: number): Promise<number>{
    const query: string = "SELECT max_articles FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_articles;
}
async function getGameMaxRounds(gameId: number): Promise<number>{
    const query: string = "SELECT max_rounds FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_rounds;
}
async function getGameCurrentRound(gameId: number): Promise<number>{
    const query: string = "SELECT current_round FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].current_round;
}
async function setGameCurrentRound(gameId: number, round: number): Promise<void>{
    const query: string = "UPDATE games SET current_round = $2 WHERE id = $1";
    const values: Array<any> = [gameId, round];
    await queryDatabase(query,values);
}
async function getGameIdFromRoomCode(roomCode: string): Promise<number>{
    const query: string = "SELECT id FROM games WHERE room_code = $1";
    const values: Array<any> = [roomCode];
    const results = await queryDatabase(query,values);
    return results[0].id;
}
async function getRoomCode(gameId: number): Promise<string>{
    const query: string = "SELECT room_code FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].room_code;
}
async function getGameIdFromPlayerId(playerId: number): Promise<number>{
    const query: string = "SELECT game_id FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].game_id;
}
async function isGameEmpty(gameId: number): Promise<boolean>{
    const query: string = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1)");
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return !(results[0].exists);
}
async function getPlayerIdFromSocketId(socketId: string): Promise<number>{
    const query: string = "SELECT id FROM players WHERE socket_id = $1";
    const values: Array<any> = [socketId];
    const results = await queryDatabase(query,values);
    return results[0].id;
}
async function getPlayerSocketId(playerId: number): Promise<string>{
    const query: string = "SELECT socket_id FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].socket_id;
}
async function getPlayerName(playerId: number): Promise<string>{
    const query: string = "SELECT screenname FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].screenname;
}
async function getPlayerScore(playerId: number): Promise<number>{
    const query: string = "SELECT score FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].score;
}
async function setPlayerScore(playerId: number, score: number): Promise<void>{
    const query: string = "UPDATE players SET score = $2 WHERE id = $1";
    const values: Array<any> = [playerId, score];
    await queryDatabase(query,values);
}
async function isPlayerHost(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_host FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_host;
}
async function resetPlayerHost(){}

async function setPlayerHost(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_host = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId];
    await queryDatabase(query,values);
}
async function isPlayerInterrogator(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_interrogator FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_interrogator;
}
async function setPlayerInterrogator(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_interrogator = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
}
async function isPlayerHonest(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_honest FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_honest;
}
async function setPlayerHonest(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_honest = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
}
async function isPlayerConnected(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_connected FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_connected;
}
async function setPlayerConnected(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_connected = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
}
async function getPlayerIdFromArticleId(articleId: number): Promise<number>{
    const query: string = "SELECT player_id FROM articles WHERE id = $1";
    const values: Array<any> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].player_id;
}
async function getArticleIdFromPlayerId(playerId: number): Promise<number>{
    const query: string = "SELECT id FROM article WHERE player_id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].id;
}
async function getArticleIdFromWikiId(wikiId: number): Promise<number>{
    const query: string = "SELECT id FROM articles WHERE wiki_id = $1";
    const values: Array<any> = [wikiId];
    const results = await queryDatabase(query,values);
    return results[0].id;
}
async function getWikiIdFromArticleId(articleId: number): Promise<number>{
    const query: string = "SELECT wiki_id FROM articles WHERE id = $1";
    const values: Array<any> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].wiki_id;
}
async function getArticleTitle(articleId: number): Promise<string>{
    const query: string = "SELECT title FROM articles WHERE id = $1";
    const values: Array<any> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].title;
}
async function addGameToDatabase(gameOptions: GameOptions): Promise<number>{
    const query: string = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const roomCode: string = await createUniqueRoomCode();
    const timestamp = (Date.now()/1000);
    const values: Array<any> = [roomCode, gameOptions.maxScore, gameOptions.maxArticles, gameOptions.maxRounds, 0, timestamp];
    await queryDatabase(query,values);
    const gameId = await getGameIdFromRoomCode(roomCode);
    return gameId;
}
async function deleteGameFromDatabase(gameId: number){
    const query: string = "DELETE FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    await queryDatabase(query,values);
}

async function addPlayerToGame(roomCode: string, player: Player){
    const query: string = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const gameId = await getGameIdFromRoomCode(roomCode);
    const values: Array<any> = [gameId, player.socket.id, player.screenname];
    await queryDatabase(query, values);
    player.socket.join(roomCode);
    const playerId = await getPlayerIdFromSocketId(player.socket.id);
    return playerId;
}

// async function addPlayerToDatabase(gameId: number, player: Player): Promise<number>{
//     const query: string = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
//     const values: Array<any> = [gameId, player.socket.id, player.screenname];
//     await queryDatabase(query, values);
//     player.socket.join()
//     const playerId = await getPlayerIdFromSocketId(player.socket.id);
//     return playerId;
// }

async function deletePlayerFromDatabase(playerId: number): Promise<void>{
    const query: string = "DELETE FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    await queryDatabase(query,values);
}
async function addArticleToDatabase(playerId: number, article: Article): Promise<number>{
    const query: string = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const values: Array<any> = [playerId,article.id,article.title];
    queryDatabase(query, values);
    const articleId = await getArticleIdFromPlayerId(playerId);
    return articleId;
}
async function deleteArticleFromDatabase(id: number): Promise<void>{
    const query: string = "DELETE FROM articles WHERE id = $1";
    const values: Array<any>= [id];
    await queryDatabase(query,values);
}
async function createNewGame(gameOptions: GameOptions, firstPlayer: Player, socket: Socket): Promise<string>{
    const gameId: number = await addGameToDatabase(gameOptions);
    const roomCode: string = await getRoomCode(gameId);
    const playerId: number = await addPlayerToGame(roomCode, firstPlayer);
    await setPlayerHost(gameId, playerId, true);
    return roomCode;
}
async function hostCheck(gameId: number){
    const query: string = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1 and is_host = true)");
    const values: Array<any> = [gameId]
    const res = await queryDatabase(query, values);
    return(res[0].exists);
}
async function winnerScoreCheck(gameId: number): Promise<any>{
    const maxScore: number = await getGameMaxScore(gameId);
    const query: string = ("SELECT * FROM players WHERE game_id = $1 AND score >= $2");
    const values: Array<any> = [gameId, maxScore]
    const res = await queryDatabase(query, values);
    if(res.length > 0){
        return res;
    } else return false;
}

async function generatePlayerArticles(player: Player): Promise<Array<any>>{
    const playerId: number = await getPlayerIdFromSocketId(player.socket.id);
    const gameId: number = await getGameIdFromPlayerId(playerId);
    const maxArticles: number = await getGameMaxArticles(gameId);
    let articleOptions: Array<any> = [];
    for(let i=0; i < maxArticles; i++){
        const randomResults: WikiQueryResults = await fetchRandomArticle();
        await articleOptions.push(randomResults);
    } 
    await io.to(player.socket.id).emit('sentArticleOptions',{options:articleOptions});
    return articleOptions;
}

// async function populateArticleList(params: QueryParams, player: Player){
//     const wikiQueryResults: WikiQueryResults = await fetchRandomArticles(params);
//     const randomResults: RandomFetchResults = wikiQueryResults.query;
//     player.articleOptions = randomResults;
//     console.log(player);
// }

// function dealOutArticles(params: QueryParams, playerList: Array<Player>){
//     for(let p in playerList){
//         populateArticleList(params, playerList[p])
//     }
// }

//addArticleToDatabase(defaultParams, 1);

//addGameToDatabase(100, 3, 1000);

// async function test(){
//     await addPlayerToDatabase(12, 'yayaya', 'Josh but remote');
//     await addPlayerToDatabase(12, 'yoyoyo', 'Dustin but remote');
//     await addPlayerToDatabase(13, 'yiyiyi', 'Hannah but remote');
//     await addPlayerToDatabase(13, 'yeyeye', 'Josh but remote...er');
// }
// test();