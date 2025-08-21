"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomCode = generateRoomCode;
exports.stripQueryToRows = stripQueryToRows;
exports.queryDatabase = queryDatabase;
exports.createUniqueRoomCode = createUniqueRoomCode;
exports.getGameMaxScore = getGameMaxScore;
exports.getGameMaxArticles = getGameMaxArticles;
exports.getGameMaxRounds = getGameMaxRounds;
exports.getGameCurrentRound = getGameCurrentRound;
exports.setGameCurrentRound = setGameCurrentRound;
exports.getGameIdFromRoomCode = getGameIdFromRoomCode;
exports.getRoomCode = getRoomCode;
exports.getGameIdFromPlayerId = getGameIdFromPlayerId;
exports.isGameEmpty = isGameEmpty;
exports.getPlayerIdFromSocketId = getPlayerIdFromSocketId;
exports.getPlayerSocketId = getPlayerSocketId;
exports.getPlayerName = getPlayerName;
exports.getPlayerScore = getPlayerScore;
exports.setPlayerScore = setPlayerScore;
exports.isPlayerHost = isPlayerHost;
exports.resetPlayerHost = resetPlayerHost;
exports.setPlayerHost = setPlayerHost;
exports.isPlayerInterrogator = isPlayerInterrogator;
exports.setPlayerInterrogator = setPlayerInterrogator;
exports.isPlayerHonest = isPlayerHonest;
exports.setPlayerHonest = setPlayerHonest;
exports.isPlayerConnected = isPlayerConnected;
exports.setPlayerConnected = setPlayerConnected;
exports.getPlayerIdFromArticleId = getPlayerIdFromArticleId;
exports.getArticleIdFromPlayerId = getArticleIdFromPlayerId;
exports.getArticleIdFromWikiId = getArticleIdFromWikiId;
exports.getWikiIdFromArticleId = getWikiIdFromArticleId;
exports.getArticleTitle = getArticleTitle;
exports.addGameToDatabase = addGameToDatabase;
exports.deleteGameFromDatabase = deleteGameFromDatabase;
exports.addPlayerToGame = addPlayerToGame;
exports.deletePlayerFromDatabase = deletePlayerFromDatabase;
exports.addArticleToDatabase = addArticleToDatabase;
exports.deleteArticleFromDatabase = deleteArticleFromDatabase;
const pg_1 = require("pg");
const secrets_js_1 = require("./secrets.js");
const constants = __importStar(require("./const.js"));
const pool = new pg_1.Pool(secrets_js_1.POSTGRESQL_CREDENTIALS);
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
function generateRoomCode(length) {
    let results = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * constants.characters.length);
        results += constants.characters.charAt(randomIndex);
    }
    return results;
}
;
async function stripQueryToRows(results) {
    return results.rows;
}
;
async function queryDatabase(query, values) {
    const client = await pool.connect();
    let res;
    if (typeof values !== 'undefined') {
        res = await pool.query(query, values);
    }
    else {
        res = await pool.query(query);
    }
    client.release();
    res = await stripQueryToRows(res);
    return res;
}
;
async function createUniqueRoomCode() {
    const query = "SELECT EXISTS (SELECT * FROM games WHERE room_code = $1)";
    let values;
    let roomCode;
    let roomCollision;
    do {
        roomCode = generateRoomCode(5);
        values = [roomCode];
        const res = await queryDatabase(query, values);
        roomCollision = res[0].exists;
    } while (roomCollision);
    return roomCode;
}
;
async function getGameMaxScore(gameId) {
    const query = "SELECT max_score FROM games WHERE id = $1";
    const values = [gameId];
    const results = await queryDatabase(query, values);
    return results[0].max_score;
}
;
async function getGameMaxArticles(gameId) {
    const query = "SELECT max_articles FROM games WHERE id = $1";
    const values = [gameId];
    const results = await queryDatabase(query, values);
    return results[0].max_articles;
}
;
async function getGameMaxRounds(gameId) {
    const query = "SELECT max_rounds FROM games WHERE id = $1";
    const values = [gameId];
    const results = await queryDatabase(query, values);
    return results[0].max_rounds;
}
;
async function getGameCurrentRound(gameId) {
    const query = "SELECT current_round FROM games WHERE id = $1";
    const values = [gameId];
    const results = await queryDatabase(query, values);
    return results[0].current_round;
}
;
async function setGameCurrentRound(gameId, round) {
    const query = "UPDATE games SET current_round = $2 WHERE id = $1";
    const values = [gameId, round];
    await queryDatabase(query, values);
}
;
async function getGameIdFromRoomCode(roomCode) {
    const query = "SELECT id FROM games WHERE room_code = $1";
    const values = [roomCode];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
;
async function getRoomCode(gameId) {
    const query = "SELECT room_code FROM games WHERE id = $1";
    const values = [gameId];
    const results = await queryDatabase(query, values);
    return results[0].room_code;
}
;
async function getGameIdFromPlayerId(playerId) {
    const query = "SELECT game_id FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].game_id;
}
;
async function isGameEmpty(gameId) {
    const query = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1)");
    const values = [gameId];
    const results = await queryDatabase(query, values);
    return !(results[0].exists);
}
;
async function getPlayerIdFromSocketId(socketId) {
    const query = "SELECT id FROM players WHERE socket_id = $1";
    const values = [socketId];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
;
async function getPlayerSocketId(playerId) {
    const query = "SELECT socket_id FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].socket_id;
}
;
async function getPlayerName(playerId) {
    const query = "SELECT screenname FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].screenname;
}
;
async function getPlayerScore(playerId) {
    const query = "SELECT score FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].score;
}
;
async function setPlayerScore(playerId, score) {
    const query = "UPDATE players SET score = $2 WHERE id = $1";
    const values = [playerId, score];
    await queryDatabase(query, values);
}
;
async function isPlayerHost(playerId) {
    const query = "SELECT is_host FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].is_host;
}
;
async function resetPlayerHost() { }
;
async function setPlayerHost(gameId, playerId, status) {
    const query = "UPDATE players SET is_host = $3 WHERE id = $2 AND game_id = $1";
    const values = [gameId, playerId];
    await queryDatabase(query, values);
}
;
async function isPlayerInterrogator(playerId) {
    const query = "SELECT is_interrogator FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].is_interrogator;
}
;
async function setPlayerInterrogator(gameId, playerId, status) {
    const query = "UPDATE players SET is_interrogator = $3 WHERE id = $2 AND game_id = $1";
    const values = [gameId, playerId, status];
    await queryDatabase(query, values);
}
;
async function isPlayerHonest(playerId) {
    const query = "SELECT is_honest FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].is_honest;
}
;
async function setPlayerHonest(gameId, playerId, status) {
    const query = "UPDATE players SET is_honest = $3 WHERE id = $2 AND game_id = $1";
    const values = [gameId, playerId, status];
    await queryDatabase(query, values);
}
;
async function isPlayerConnected(playerId) {
    const query = "SELECT is_connected FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].is_connected;
}
;
async function setPlayerConnected(gameId, playerId, status) {
    const query = "UPDATE players SET is_connected = $3 WHERE id = $2 AND game_id = $1";
    const values = [gameId, playerId, status];
    await queryDatabase(query, values);
}
;
async function getPlayerIdFromArticleId(articleId) {
    const query = "SELECT player_id FROM articles WHERE id = $1";
    const values = [articleId];
    const results = await queryDatabase(query, values);
    return results[0].player_id;
}
;
async function getArticleIdFromPlayerId(playerId) {
    const query = "SELECT id FROM article WHERE player_id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
;
async function getArticleIdFromWikiId(wikiId) {
    const query = "SELECT id FROM articles WHERE wiki_id = $1";
    const values = [wikiId];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
;
async function getWikiIdFromArticleId(articleId) {
    const query = "SELECT wiki_id FROM articles WHERE id = $1";
    const values = [articleId];
    const results = await queryDatabase(query, values);
    return results[0].wiki_id;
}
;
async function getArticleTitle(articleId) {
    const query = "SELECT title FROM articles WHERE id = $1";
    const values = [articleId];
    const results = await queryDatabase(query, values);
    return results[0].title;
}
;
async function addGameToDatabase(gameOptions) {
    const query = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const roomCode = await createUniqueRoomCode();
    const timestamp = (Date.now() / 1000);
    const values = [roomCode, gameOptions.maxScore, gameOptions.maxArticles, gameOptions.maxRounds, 0, timestamp];
    await queryDatabase(query, values);
    const gameId = await getGameIdFromRoomCode(roomCode);
    return gameId;
}
;
async function deleteGameFromDatabase(gameId) {
    const query = "DELETE FROM games WHERE id = $1";
    const values = [gameId];
    await queryDatabase(query, values);
}
;
async function addPlayerToGame(roomCode, player) {
    const query = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const gameId = await getGameIdFromRoomCode(roomCode);
    const values = [gameId, player.socket.id, player.screenname];
    await queryDatabase(query, values);
    player.socket.join(roomCode);
    const playerId = await getPlayerIdFromSocketId(player.socket.id);
    return playerId;
}
;
// async function addPlayerToDatabase(gameId: number, player: Player): Promise<number>{
//     const query: string = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
//     const values: Array<any> = [gameId, player.socket.id, player.screenname];
//     await queryDatabase(query, values);
//     player.socket.join()
//     const playerId = await getPlayerIdFromSocketId(player.socket.id);
//     return playerId;
// }
async function deletePlayerFromDatabase(playerId) {
    const query = "DELETE FROM players WHERE id = $1";
    const values = [playerId];
    await queryDatabase(query, values);
}
;
async function addArticleToDatabase(playerId, article) {
    const query = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const values = [playerId, article.id, article.title];
    queryDatabase(query, values);
    const articleId = await getArticleIdFromPlayerId(playerId);
    return articleId;
}
;
async function deleteArticleFromDatabase(id) {
    const query = "DELETE FROM articles WHERE id = $1";
    const values = [id];
    await queryDatabase(query, values);
}
;
