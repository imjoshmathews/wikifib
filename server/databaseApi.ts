import { Pool } from "pg";
import { postgresqlCredentials }  from './secrets';
import * as constants from './const'
import { Player, Article, GameOptions } from './interfaces';

const pool: Pool = new Pool(postgresqlCredentials);
pool.on('error', (err, client) =>{
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export function generateRoomCode(length: number): string {
    let results: string = '';
    for (let i = 0; i < length; i++) {
        const randomIndex: number = Math.floor(Math.random() * constants.characters.length);
        results += constants.characters.charAt(randomIndex);
    }
    return results;
};
export async function stripQueryToRows(results){
    return results.rows;
};
export async function queryDatabase(query: string, values?: Array<any>): Promise<Array<any>>{
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
};
export async function createUniqueRoomCode(): Promise<string>{
    const query: string = "SELECT EXISTS (SELECT * FROM games WHERE room_code = $1)";
    let values: Array<any>;
    let roomCode: string;
    let roomCollision: boolean;
    do { 
        roomCode = generateRoomCode(5);
        values = [roomCode];
        const res = await queryDatabase(query, values);
        roomCollision = res[0].exists;
    } while (roomCollision);
    return roomCode;
};
export async function getGameMaxScore(gameId: number): Promise<number>{
    const query: string = "SELECT max_score FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_score;
};
export async function getGameMaxArticles(gameId: number): Promise<number>{
    const query: string = "SELECT max_articles FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_articles;
};
export async function getGameMaxRounds(gameId: number): Promise<number>{
    const query: string = "SELECT max_rounds FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].max_rounds;
};
export async function getGameCurrentRound(gameId: number): Promise<number>{
    const query: string = "SELECT current_round FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].current_round;
};
export async function setGameCurrentRound(gameId: number, round: number): Promise<void>{
    const query: string = "UPDATE games SET current_round = $2 WHERE id = $1";
    const values: Array<any> = [gameId, round];
    await queryDatabase(query,values);
};
export async function getGameIdFromRoomCode(roomCode: string): Promise<number>{
    const query: string = "SELECT id FROM games WHERE room_code = $1";
    const values: Array<any> = [roomCode];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getRoomCode(gameId: number): Promise<string>{
    const query: string = "SELECT room_code FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return results[0].room_code;
};
export async function getGameIdFromPlayerId(playerId: number): Promise<number>{
    const query: string = "SELECT game_id FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].game_id;
};
export async function isGameEmpty(gameId: number): Promise<boolean>{
    const query: string = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1)");
    const values: Array<any> = [gameId];
    const results = await queryDatabase(query,values);
    return !(results[0].exists);
};
export async function getPlayerIdFromSocketId(socketId: string): Promise<number>{
    const query: string = "SELECT id FROM players WHERE socket_id = $1";
    const values: Array<any> = [socketId];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getPlayerSocketId(playerId: number): Promise<string>{
    const query: string = "SELECT socket_id FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].socket_id;
};
export async function getPlayerName(playerId: number): Promise<string>{
    const query: string = "SELECT screenname FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].screenname;
};
export async function getPlayerScore(playerId: number): Promise<number>{
    const query: string = "SELECT score FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].score;
};
export async function setPlayerScore(playerId: number, score: number): Promise<void>{
    const query: string = "UPDATE players SET score = $2 WHERE id = $1";
    const values: Array<any> = [playerId, score];
    await queryDatabase(query,values);
};
export async function isPlayerHost(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_host FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_host;
};
export async function resetPlayerHost(){};
export async function setPlayerHost(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_host = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId];
    await queryDatabase(query,values);
};
export async function isPlayerInterrogator(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_interrogator FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_interrogator;
};
export async function setPlayerInterrogator(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_interrogator = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function isPlayerHonest(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_honest FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_honest;
};
export async function setPlayerHonest(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_honest = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function isPlayerConnected(playerId:number): Promise<boolean>{
    const query: string = "SELECT is_connected FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].is_connected;
};
export async function setPlayerConnected(gameId: number, playerId: number, status: boolean): Promise<void>{
    const query: string = "UPDATE players SET is_connected = $3 WHERE id = $2 AND game_id = $1";
    const values: Array<any> = [gameId, playerId, status];
    await queryDatabase(query,values);
};
export async function getPlayerIdFromArticleId(articleId: number): Promise<number>{
    const query: string = "SELECT player_id FROM articles WHERE id = $1";
    const values: Array<any> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].player_id;
};
export async function getArticleIdFromPlayerId(playerId: number): Promise<number>{
    const query: string = "SELECT id FROM article WHERE player_id = $1";
    const values: Array<any> = [playerId];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getArticleIdFromWikiId(wikiId: number): Promise<number>{
    const query: string = "SELECT id FROM articles WHERE wiki_id = $1";
    const values: Array<any> = [wikiId];
    const results = await queryDatabase(query,values);
    return results[0].id;
};
export async function getWikiIdFromArticleId(articleId: number): Promise<number>{
    const query: string = "SELECT wiki_id FROM articles WHERE id = $1";
    const values: Array<any> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].wiki_id;
};
export async function getArticleTitle(articleId: number): Promise<string>{
    const query: string = "SELECT title FROM articles WHERE id = $1";
    const values: Array<any> = [articleId];
    const results = await queryDatabase(query,values);
    return results[0].title;
};
export async function addGameToDatabase(gameOptions: GameOptions): Promise<number>{
    const query: string = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const roomCode: string = await createUniqueRoomCode();
    const timestamp = (Date.now()/1000);
    const values: Array<any> = [roomCode, gameOptions.maxScore, gameOptions.maxArticles, gameOptions.maxRounds, 0, timestamp];
    await queryDatabase(query,values);
    const gameId = await getGameIdFromRoomCode(roomCode);
    return gameId;
};
export async function deleteGameFromDatabase(gameId: number){
    const query: string = "DELETE FROM games WHERE id = $1";
    const values: Array<any> = [gameId];
    await queryDatabase(query,values);
};

export async function addPlayerToGame(roomCode: string, player: Player){
    const query: string = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const gameId = await getGameIdFromRoomCode(roomCode);
    const values: Array<any> = [gameId, player.socket.id, player.screenname];
    await queryDatabase(query, values);
    player.socket.join(roomCode);
    const playerId = await getPlayerIdFromSocketId(player.socket.id);
    return playerId;
};

export async function deletePlayerFromDatabase(playerId: number): Promise<void>{
    const query: string = "DELETE FROM players WHERE id = $1";
    const values: Array<any> = [playerId];
    await queryDatabase(query,values);
};
export async function addArticleToDatabase(playerId: number, article: Article): Promise<number>{
    const query: string = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const values: Array<any> = [playerId,article.id,article.title];
    queryDatabase(query, values);
    const articleId = await getArticleIdFromPlayerId(playerId);
    return articleId;
};
export async function deleteArticleFromDatabase(id: number): Promise<void>{
    const query: string = "DELETE FROM articles WHERE id = $1";
    const values: Array<any>= [id];
    await queryDatabase(query,values);
};