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
// import { Pool } from "pg";
// import { POSTGRESQL_CREDENTIALS }  from './secrets.js';
const databaseApi = __importStar(require("./databaseApi"));
const constants = __importStar(require("./const"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// const pool = new Pool(POSTGRESQL_CREDENTIALS);
// pool.on('error', (err, client) =>{
//     console.error('Unexpected error on idle client', err);
//     process.exit(-1);
// });
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    }
});
const wikiApiRoot = constants.wikiApiRoot;
const roomCodeLength = constants.roomIdLength;
const defaultParams = constants.defaultParams;
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
async function queryTest() {
    console.log("QueryTest Started");
    const output = await databaseApi.getGameMaxScore(19);
    console.log("The max score of game 19 is", output);
}
io.on("connection", (socket) => {
    queryTest();
    console.log('Socket has connected');
    console.log(socket.id);
    // inbound events
    socket.on("disconnect", (reason) => {
        console.log('Socket has disconnected');
    });
    socket.on("createGame", async (options, player) => {
        const roomCode = await createNewGame(options, player, socket);
        io.to(socket.id).emit("gameCreated", roomCode);
        console.log("gameCreated: " + roomCode);
    });
    socket.on("joinGame", async (roomCode, player) => {
        const playerId = await databaseApi.addPlayerToGame(roomCode, player);
        io.to(roomCode).emit("playerJoined", playerId);
    });
    socket.on("startGame", (roomCode) => {
        io.to(roomCode).emit("gameStarted");
    });
    socket.on("leaveGame", async () => {
        const playerId = await databaseApi.getPlayerIdFromSocketId(socket.id);
        await databaseApi.deletePlayerFromDatabase(playerId);
        const gameId = await databaseApi.getGameIdFromPlayerId(playerId);
        const gameEmpty = await databaseApi.isGameEmpty(gameId);
        if (gameEmpty) {
            await databaseApi.deleteGameFromDatabase(gameId);
        }
        ;
    });
    socket.on("endGame", async (roomCode) => {
        const gameId = await databaseApi.getGameIdFromRoomCode(roomCode);
        await databaseApi.deleteGameFromDatabase(gameId);
        io.to(roomCode).emit("gameEnded");
    });
    socket.on("guessPlayer", (player) => {
    });
    socket.on("promotePlayerToHost", async () => {
        const playerId = await databaseApi.getPlayerIdFromSocketId(socket.id);
        const gameId = await databaseApi.getGameIdFromPlayerId(playerId);
        await databaseApi.setPlayerHost(gameId, playerId, true);
    });
    socket.on("selectArticle", async (article) => {
        const playerId = await databaseApi.getPlayerIdFromSocketId(socket.id);
        let oldArticleId;
        oldArticleId = await databaseApi.getArticleIdFromPlayerId(playerId);
        if (oldArticleId !== undefined) {
            await databaseApi.deleteArticleFromDatabase(oldArticleId);
        }
        ;
        await databaseApi.addArticleToDatabase(playerId, article);
    });
    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});
async function initPlayer(roomCode, player) {
    await databaseApi.addPlayerToGame(roomCode, player);
    generatePlayerArticles(player);
}
;
httpServer.listen(3666);
const defaultOptions = {
    maxScore: 10,
    maxArticles: 3,
    maxRounds: 5,
};
function stringifyWikiQuery(params) {
    let url = wikiApiRoot + "?origin=*";
    Object.keys(params).forEach(function (key) { url += "&" + key + "=" + params[key]; });
    return url;
}
async function fetchRandomArticle() {
    const response = await fetch(stringifyWikiQuery(defaultParams));
    const wikiQueryResults = await response.json();
    const randomResults = wikiQueryResults.query.random[0];
    return randomResults;
}
async function generatePlayerArticles(player) {
    const playerId = await databaseApi.getPlayerIdFromSocketId(player.socket.id);
    const gameId = await databaseApi.getGameIdFromPlayerId(playerId);
    const maxArticles = await databaseApi.getGameMaxArticles(gameId);
    let articleOptions = [];
    for (let i = 0; i < maxArticles; i++) {
        const randomResults = await fetchRandomArticle();
        await articleOptions.push(randomResults);
    }
    await io.to(player.socket.id).emit('sentArticleOptions', { options: articleOptions });
    return articleOptions;
}
async function createNewGame(gameOptions, firstPlayer, socket) {
    const gameId = await databaseApi.addGameToDatabase(gameOptions);
    const roomCode = await databaseApi.getRoomCode(gameId);
    const playerId = await databaseApi.addPlayerToGame(roomCode, firstPlayer);
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
