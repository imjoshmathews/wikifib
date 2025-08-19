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
const pg_1 = require("pg");
const secrets_js_1 = require("./secrets.js");
const CONSTANTS = __importStar(require("./const.js"));
const pool = new pg_1.Pool(secrets_js_1.POSTGRESQL_CREDENTIALS);
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
const wikiApiRoot = CONSTANTS.WIKI_API_ROOT;
const roomCodeLength = CONSTANTS.ROOM_ID_LENGTH;
const defaultParams = CONSTANTS.DEFAULTPARAMS;
const defaultOptions = {
    maxScore: 10,
    maxArticles: 3,
    maxRounds: 5,
};
function generateRoomCode(length) {
    let results = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * CONSTANTS.CHARACTERS.length);
        results += CONSTANTS.CHARACTERS.charAt(randomIndex);
    }
    return results;
}
function stringifyWikiQuery(params) {
    let url = wikiApiRoot + "?origin=*";
    Object.keys(params).forEach(function (key) { url += "&" + key + "=" + params[key]; });
    return url;
}
async function fetchRandomArticle(params) {
    const response = await fetch(stringifyWikiQuery(params));
    const wikiQueryResults = await response.json();
    const randomResults = wikiQueryResults.query.random[0];
    return randomResults;
}
async function stripQueryToRows(results) {
    return results.rows;
}
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
async function createUniqueRoomCode() {
    const query = "SELECT EXISTS (SELECT * FROM games WHERE room_code = $1)";
    let values;
    let roomCode;
    let roomCollision;
    do {
        roomCode = generateRoomCode(roomCodeLength);
        values = [roomCode];
        const res = await queryDatabase(query, values);
        roomCollision = res[0].exists;
    } while (roomCollision);
    return roomCode;
}
async function getGameIdFromRoomCode(roomCode) {
    const query = "SELECT id FROM games WHERE room_code = $1";
    const values = [roomCode];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
async function getPlayerIdFromSocketId(socketId) {
    const query = "SELECT id FROM players WHERE socket_id = $1";
    const values = [socketId];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
async function getPlayerNameFromPlayerId(playerId) {
    const query = "SELECT screenname FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].screenname;
}
async function getPlayerScoreFromPlayerId(playerId) {
    const query = "SELECT score FROM players WHERE id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].score;
}
async function getArticleIdFromPlayerId(playerId) {
    const query = "SELECT id FROM players WHERE player_id = $1";
    const values = [playerId];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
async function getArticleIdFromWikiId(wikiId) {
    const query = "SELECT id FROM articles WHERE wiki_id = $1";
    const values = [wikiId];
    const results = await queryDatabase(query, values);
    return results[0].id;
}
async function getArticleTitleFromArticleId(articleId) {
    const query = "SELECT title FROM articles WHERE id = $1";
    const values = [articleId];
    const results = await queryDatabase(query, values);
    return results[0].title;
}
async function addGameToDatabase(gameOptions) {
    const query = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const roomCode = await createUniqueRoomCode();
    const timestamp = (Date.now() / 1000);
    const values = [roomCode, gameOptions.maxScore, gameOptions.maxArticles, gameOptions.maxRounds, 0, timestamp];
    await queryDatabase(query, values);
    const gameId = await getGameIdFromRoomCode(roomCode);
    return gameId;
}
async function deleteGameFromDatabase(id) {
    const query = "DELETE FROM games WHERE id = $1";
    const values = [id];
    await queryDatabase(query, values);
}
async function addPlayerToDatabase(gameId, player) {
    const query = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const values = [gameId, player.socketId, player.screenname];
    await queryDatabase(query, values);
    const playerId = await getPlayerIdFromSocketId(player.socketId);
    return playerId;
}
async function deletePlayerFromDatabase(id) {
    const query = "DELETE FROM players WHERE id = $1";
    const values = [id];
    await queryDatabase(query, values);
}
async function setPlayerAsGameHost(gameId, newHostId) {
    const query = "UPDATE players SET is_host = true WHERE id = $2 AND game_id = $1";
    const values = [gameId, newHostId];
    await queryDatabase(query, values);
}
async function addArticleToDatabase(params, playerId) {
    const wikiQueryResults = await fetchRandomArticle(params);
    const randomResults = wikiQueryResults.query.random[0];
    const query = "INSERT INTO articles(player_id, wiki_id, title) VALUES ($1,$2,$3)";
    const values = [playerId, randomResults.id, randomResults.title];
    queryDatabase(query, values);
}
async function deleteArticleFromDatabase(id) {
    const query = "DELETE FROM articles WHERE id = $1";
    const values = [id];
    await queryDatabase(query, values);
}
async function createNewGame(gameOptions, firstPlayer) {
    const gameId = await addGameToDatabase(gameOptions);
    const playerId = await addPlayerToDatabase(gameId, firstPlayer);
    await setPlayerAsGameHost(gameId, playerId);
}
let testboy = {
    socketId: 'finality',
    screenname: 'John Green'
};
let newgame = {
    maxArticles: 6,
    maxRounds: 6,
    maxScore: 6,
};
createNewGame(newgame, testboy);
// async function test(){
//     let output1 : number = await getPlayerIdFromSocketId('wesd');
//     console.log(output1);
//     let output2: string = await getPlayerNameFromPlayerId(output1);
//     console.log(output2);
// } test();
async function hostCheck(gameId) {
    const query = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1 and is_host = true)");
    const values = [gameId];
    const res = await queryDatabase(query, values);
    return (res[0].exists);
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
// instantiatePlayer(defaultRoom, "Josh");
// // instantiatePlayer(defaultRoom, "Hannah");
// // dealOutArticles(defaultRoom.queryParams, defaultRoom.playerList);
// // console.log(defaultRoom);
// // console.log(defaultRoom.playerList);
//  setTimeout(() => {
//      console.log(JSON.stringify(defaultRoom, null, "\t"));
//  //    for(let p in defaultRoom.playerList){
//  //        console.log(defaultRoom.playerList[p].articleOptions)
//  //    }
//  }, 2000);
// // SELECT ARTICLE
//addArticleToDatabase(defaultParams, 1);
//addGameToDatabase(100, 3, 1000);
// async function test(){
//     await addPlayerToDatabase(12, 'yayaya', 'Josh but remote');
//     await addPlayerToDatabase(12, 'yoyoyo', 'Dustin but remote');
//     await addPlayerToDatabase(13, 'yiyiyi', 'Hannah but remote');
//     await addPlayerToDatabase(13, 'yeyeye', 'Josh but remote...er');
// }
// test();
