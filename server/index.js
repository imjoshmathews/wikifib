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
// async function queryTest(){
//     const query = "SELECT * FROM articles";
//     const data = [1];
//     const client = await pool.connect();
//     const res = await pool.query(query);
//     console.log(res.rows);
//     client.release();
// }
// queryTest();
const wikiApiRoot = CONSTANTS.WIKI_API_ROOT;
const roomIdLength = CONSTANTS.ROOM_ID_LENGTH;
const defaultChoiceCount = 1;
const defaultParams = CONSTANTS.DEFAULTPARAMS;
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
    return res;
}
function stringifyWikiQuery(params) {
    let url = wikiApiRoot + "?origin=*";
    Object.keys(params).forEach(function (key) { url += "&" + key + "=" + params[key]; });
    return url;
}
function generateRoomId(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < len; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        res += chars.charAt(randomIndex);
    }
    return res;
}
async function fetchRandomArticles(params) {
    const response = await fetch(stringifyWikiQuery(params));
    const wikiQueryResults = await response.json();
    return wikiQueryResults;
}
async function addGameToDatabase(maxScore, maxArticles, maxRounds) {
    const roomID = generateRoomId(roomIdLength);
    const query = "INSERT INTO games(room_code, max_score, max_articles, max_rounds, current_round, created_at) VALUES ($1,$2,$3,$4,$5,to_timestamp($6))";
    const timestamp = (Date.now() / 1000);
    const values = [roomID, maxScore, maxArticles, maxRounds, 0, timestamp];
    const output = await queryDatabase(query, values);
    console.log(output);
}
async function deleteGameFromDatabase(id) {
    const query = "DELETE FROM games WHERE id = $1";
    const values = [id];
    await queryDatabase(query, values);
}
async function addPlayerToDatabase(gameId, socketId, screenname) {
    const query = "INSERT INTO players(game_id, socket_id, screenname) VALUES ($1,$2,$3)";
    const values = [gameId, socketId, screenname];
    queryDatabase(query, values);
}
async function setPlayerAsGameHost(gameId, newHostId) {
    const query = "UPDATE players SET is_host = true WHERE... ";
    // finish this sql query later
}
async function deletePlayerFromDatabase(id) {
    const query = "DELETE FROM players WHERE id = $1";
    const values = [id];
    await queryDatabase(query, values);
}
async function addArticleToDatabase(params, playerId) {
    const wikiQueryResults = await fetchRandomArticles(params);
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
async function hostCheck(gameId) {
    const query = ("SELECT EXISTS (SELECT * FROM players WHERE game_id = $1 and is_host = true)");
    const values = [gameId];
    const res = await queryDatabase(query, values);
    return (res.rows[0].exists);
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
addGameToDatabase(100, 3, 1000);
async function test() {
    await addPlayerToDatabase(12, 'yayaya', 'Josh but remote');
    await addPlayerToDatabase(12, 'yoyoyo', 'Dustin but remote');
    await addPlayerToDatabase(13, 'yiyiyi', 'Hannah but remote');
    await addPlayerToDatabase(13, 'yeyeye', 'Josh but remote...er');
}
// test();
