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
const databaseApi = __importStar(require("./databaseApi"));
const constants = __importStar(require("./const"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
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
// io.on("updateArticleOptions", () => {})
// io.on("updateActiveArticle", () => {})
// io.on("updateScore", () => {})
// io.on("updateRound", () => {})
// io.on("updateHost", () => {})
// io.on("updateInterrogator", () => {})
// io.on("updateHonestPlayer", () => {})
// io.on("playerKicked", () => {})
// io.on("playerGuessed", () => {})
async function queryTest() {
    const output = await databaseApi.getAllPlayerObjects(19);
    const readable = JSON.stringify(output);
    console.log("The max score of game 19 is", output);
}
io.on("connection", (socket) => {
    queryTest();
    console.log('Socket has connected');
    console.log(socket.id);
    let player = {
        id: undefined,
        game_id: undefined,
        socket_id: socket.id,
        screenname: undefined,
        score: undefined,
        is_host: undefined,
        is_interrogator: undefined,
        is_honest: undefined,
        is_connected: true,
    };
    socket.on("createGame", async (initOptions) => {
        player.screenname = initOptions.hostScreenname;
        const newGameOutput = await createNewGame(initOptions, player);
        player = newGameOutput[0];
        const roomCode = newGameOutput[1];
        io.to(socket.id).emit("gameCreated", roomCode);
        io.to(socket.id).emit("playerUpdated", { affectsMe: true, playerData: player });
        socket.join(roomCode);
    });
    socket.on("joinGame", async (roomCode, screenname) => {
        player.screenname = screenname;
        player.game_id = await databaseApi.getGameIdFromRoomCode(roomCode);
        player.id = await databaseApi.addPlayerToGame(roomCode, player);
        io.to(roomCode).emit("playerJoined", player);
        socket.join(roomCode);
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
    socket.on("disconnect", (reason) => {
        console.log('Socket has disconnected:', reason);
        playerExit(player);
    });
    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});
async function playerExit(player) {
    await databaseApi.deletePlayerFromDatabase(player.id);
    const gameEmpty = await databaseApi.isGameEmpty(player.game_id);
    if (gameEmpty) {
        await databaseApi.deleteGameFromDatabase(player.game_id);
    }
    else {
        const roomCode = await databaseApi.getRoomCode(player.game_id);
        io.to(roomCode).emit("playerLeft", player.screenname);
        if (player.is_host) { }
        if (player.is_interrogator) { }
        if (player.is_honest) { }
    }
    ;
}
async function roundStart(gameId) {
    const playerList = await databaseApi.getAllPlayerIds(gameId);
    for (const player of playerList) {
        const socketId = databaseApi.getPlayerSocketId(player);
    }
}
async function assignHonestPlayer(gameId) {
    const playerList = await databaseApi.getAllPlayerObjects(gameId);
    let candidates = [];
    for (const player of playerList) {
        if (!player.is_honest) {
            candidates.push(player);
        }
        else {
            databaseApi.setPlayerInterrogator(player.game_id, player.id, true);
            databaseApi.setPlayerHonest(player.game_id, player.id, false);
        }
    }
    const honestPlayer = candidates[Math.floor(Math.random() * candidates.length)];
    for (const player of candidates) {
        databaseApi.setPlayerInterrogator(player.game_id, player.id, false);
        if (player === honestPlayer) {
            databaseApi.setPlayerHonest(player.game_id, player.id, true);
        }
    }
}
async function initPlayer(roomCode, player) {
    await databaseApi.addPlayerToGame(roomCode, player);
    generatePlayerArticles(player);
}
;
httpServer.listen(3666);
const defaultOptions = {
    max_score: 10,
    max_articles: 3,
    max_rounds: 5,
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
    const playerId = await databaseApi.getPlayerIdFromSocketId(player.socket_id);
    const gameId = await databaseApi.getGameIdFromPlayerId(playerId);
    const maxArticles = await databaseApi.getGameMaxArticles(gameId);
    let articleOptions = [];
    for (let i = 0; i < maxArticles; i++) {
        const randomResults = await fetchRandomArticle();
        await articleOptions.push(randomResults);
    }
    await io.to(player.socket_id).emit('sentArticleOptions', { options: articleOptions });
    return articleOptions;
}
async function createNewGame(initOptions, firstPlayer) {
    const gameId = await databaseApi.addGameToDatabase(initOptions.gameOptions);
    firstPlayer.game_id = gameId;
    const roomCode = await databaseApi.getRoomCode(gameId);
    const playerId = await databaseApi.addPlayerToGame(roomCode, firstPlayer);
    firstPlayer.id = playerId;
    firstPlayer.is_host = true;
    await databaseApi.setPlayerHost(gameId, playerId, true);
    return [firstPlayer, roomCode];
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
