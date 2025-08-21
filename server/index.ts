import * as databaseApi from './databaseApi';
import * as constants from './const';
import { createServer } from "http";
import { DisconnectReason, Server, Socket } from "socket.io";
import {QueryParams, Player, Article, GameOptions, WikiQueryResults} from './interfaces';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});
const wikiApiRoot: string = constants.wikiApiRoot;
const roomCodeLength: number = constants.roomIdLength;
const defaultParams: QueryParams = constants.defaultParams;

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
async function queryTest(){
    console.log("QueryTest Started");
    const output = await databaseApi.getGameMaxScore(19);
    console.log("The max score of game 19 is", output);
}
io.on("connection", (socket: Socket) => {
    queryTest();
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
        const playerId = await databaseApi.addPlayerToGame(roomCode, player);
        io.to(roomCode).emit("playerJoined", playerId)
    });
    socket.on("startGame", (roomCode: string) => {
        io.to(roomCode).emit("gameStarted");
    });
    socket.on("leaveGame", async () => {
        const playerId: number = await databaseApi.getPlayerIdFromSocketId(socket.id);
        await databaseApi.deletePlayerFromDatabase(playerId);
        const gameId: number = await databaseApi.getGameIdFromPlayerId(playerId);
        const gameEmpty: boolean = await databaseApi.isGameEmpty(gameId);
        if( gameEmpty ) { await databaseApi.deleteGameFromDatabase(gameId); };
    });
    socket.on("endGame", async (roomCode: string) => {
        const gameId: number = await databaseApi.getGameIdFromRoomCode(roomCode);
        await databaseApi.deleteGameFromDatabase(gameId);
        io.to(roomCode).emit("gameEnded");
    });
    socket.on("guessPlayer", (player: Player) => {
    });
    socket.on("promotePlayerToHost", async () => {
        const playerId: number = await databaseApi.getPlayerIdFromSocketId(socket.id);
        const gameId = await databaseApi.getGameIdFromPlayerId(playerId)
        await databaseApi.setPlayerHost(gameId, playerId, true)
    });
    socket.on("selectArticle", async (article: Article) => {
        const playerId = await databaseApi.getPlayerIdFromSocketId(socket.id);
        let oldArticleId : number | undefined;
        oldArticleId = await databaseApi.getArticleIdFromPlayerId(playerId)
        if(oldArticleId !== undefined){ await databaseApi.deleteArticleFromDatabase(oldArticleId); };
        await databaseApi.addArticleToDatabase(playerId, article);
    });
    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});

async function initPlayer(roomCode: string, player: Player) {
    await databaseApi.addPlayerToGame(roomCode, player);
    generatePlayerArticles(player);
};

httpServer.listen(3666);

const defaultOptions: GameOptions = {
    maxScore: 10,
    maxArticles: 3,
    maxRounds: 5,
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

async function generatePlayerArticles(player: Player): Promise<Array<any>>{
    const playerId: number = await databaseApi.getPlayerIdFromSocketId(player.socket.id);
    const gameId: number = await databaseApi.getGameIdFromPlayerId(playerId);
    const maxArticles: number = await databaseApi.getGameMaxArticles(gameId);
    let articleOptions: Array<any> = [];
    for(let i=0; i < maxArticles; i++){
        const randomResults: WikiQueryResults = await fetchRandomArticle();
        await articleOptions.push(randomResults);
    } 
    await io.to(player.socket.id).emit('sentArticleOptions',{options:articleOptions});
    return articleOptions;
}

async function createNewGame(gameOptions: GameOptions, firstPlayer: Player, socket: Socket): Promise<string>{
    const gameId: number = await databaseApi.addGameToDatabase(gameOptions);
    const roomCode: string = await databaseApi.getRoomCode(gameId);
    const playerId: number = await databaseApi.addPlayerToGame(roomCode, firstPlayer);
    await databaseApi.setPlayerHost(gameId, playerId, true);
    return roomCode;
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