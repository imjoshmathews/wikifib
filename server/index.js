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
    pingTimeout: 30000,
    connectionStateRecovery: {},
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
async function sanityCheck() {
    console.log("Sanity Check");
}
sanityCheck();
io.on("connection", (socket) => {
    //sanityCheck();
    console.log('Socket has connected:', socket.id);
    let player = {
        id: undefined,
        game_id: undefined,
        socket_id: socket.id,
        screenname: undefined,
        score: 0,
        is_host: false,
        is_interrogator: false,
        is_honest: false,
        is_ready: false,
        is_connected: false,
    };
    let playersArticle = {
        id: undefined,
        player_id: undefined,
        wiki_id: undefined,
        title: undefined,
    };
    // let activeArticle: Article = {
    //     id: undefined,
    //     player_id: undefined,
    //     wiki_id: undefined,
    //     title: undefined,
    // }
    let roomCode;
    socket.on("createGame", async (initOptions) => {
        const socketIdUnique = await databaseApi.isSocketIdUnique(socket.id);
        console.log(socketIdUnique);
        if (socketIdUnique) {
            console.log("Game create emit received");
            console.log(JSON.stringify(initOptions));
            player.screenname = initOptions.hostScreenname;
            const newGameOutput = await createNewGame(initOptions, player);
            player = newGameOutput[0];
            roomCode = newGameOutput[1];
            await io.to(socket.id).emit("playerUpdated", player);
            await io.to(socket.id).emit("gameCreated", roomCode, player);
            socket.join(roomCode);
            console.log(socket.rooms);
        }
        else {
            io.to(player.socket_id).emit("errorSocketIdNotUnique");
        }
    });
    socket.on("joinGame", async (rawRoomCode, screenname) => {
        const socketIdUnique = await databaseApi.isSocketIdUnique(socket.id);
        if (rawRoomCode === null) {
            io.to(player.socket_id).emit("errorNoRoomCodeProvided");
            return;
        }
        ;
        roomCode = rawRoomCode.toUpperCase();
        const roomExists = await databaseApi.doesRoomCodeExist(roomCode);
        if (!roomExists) {
            io.to(player.socket_id).emit("errorNoRoomFound");
            return;
        }
        else if (!socketIdUnique) {
            io.to(player.socket_id).emit("errorSocketIdNotUnique");
            return;
        }
        else {
            const gameId = await databaseApi.getGameIdFromRoomCode(roomCode);
            const game = await databaseApi.getGameObject(gameId);
            if (!game.game_started) {
                player.screenname = screenname;
                player.game_id = gameId;
                player.is_connected = true;
                player.id = await databaseApi.addPlayerToGame(roomCode, player);
                socket.join(roomCode);
                await io.to(socket.id).emit("playerUpdated", player);
                await io.to(socket.id).emit("youJoined", roomCode, player);
                socket.to(roomCode).emit("playerJoined");
            }
            else {
                io.to(socket.id).emit("errorGameAlreadyStarted");
            }
        }
    });
    socket.on("playerReconnecting", async (loadedRoomCode, loadedPlayer) => {
        const gameExists = await databaseApi.doesGameExist(loadedPlayer.game_id);
        if (gameExists) {
            roomCode = loadedRoomCode;
            socket.join(roomCode);
            player = loadedPlayer;
            player.socket_id = socket.id;
            await databaseApi.updatePlayer(player);
            await pushPlayerList();
            await pushActiveArticle();
            await pushGameData();
            io.to(roomCode).emit('playerRejoined');
        }
        else
            io.to(socket.id).emit('errorGameNoLongerExists');
    });
    socket.on("startGame", async () => {
        let game = await databaseApi.getGameObject(player.game_id);
        if (game.game_started) {
            io.to(socket.id).emit("errorGameStarted");
        }
        else {
            game.game_started = true;
            await databaseApi.updateGame(game);
            io.to(roomCode).emit("gameStarted");
        }
    });
    socket.on("leaveGame", () => {
    });
    socket.on("endGame", async (roomCode) => {
        if (player.is_host) {
            const gameId = await databaseApi.getGameIdFromRoomCode(roomCode);
            await databaseApi.deleteGameFromDatabase(gameId);
            io.to(roomCode).emit("gameEnded");
        }
        else {
            io.to(player.socket_id).emit("errorNotHost");
        }
    });
    socket.on("requestPlayerList", async () => { pushPlayerList(); });
    socket.on("requestActiveArticle", async () => { pushActiveArticle(); });
    socket.on("requestGameData", async () => { pushGameData(); });
    socket.on("requestArticleOptions", async () => {
        const articleOptions = await generateArticleOptions();
        io.to(socket.id).emit("deliveringArticleOptions", articleOptions);
    });
    socket.on("guessPlayer", async (guessedPlayer) => {
        guessedPlayer.score += constants.gotGuessedScore;
        if (guessedPlayer.is_honest) {
            player.score += constants.correctGuessScore;
            guessedPlayer.is_ready = false;
        }
        else {
            let honestPlayer = await databaseApi.getHonestPlayer(player.game_id);
            honestPlayer.is_ready = false;
            await databaseApi.updatePlayer(honestPlayer);
        }
        await databaseApi.updatePlayer(guessedPlayer);
        await databaseApi.updatePlayer(player);
        io.to(roomCode).emit("playerGuessed", guessedPlayer);
    });
    socket.on("promotePlayerToHost", async (player) => {
        // incomplete function
        if (!player.is_host) {
            io.to(player.socket_id).emit("errorNotHost");
            return;
        }
        const oldHost = await databaseApi.getHost(player.game_id);
        databaseApi.setPlayerHost(oldHost.game_id, oldHost.id, false);
        databaseApi.setPlayerHost(player.game_id, player.id, true);
        io.to(player.socket_id).emit("playerUpdated");
        io.to(oldHost.socket_id).emit("playerUpdated");
    });
    socket.on("selectedArticle", async (selectedArticle) => {
        const playerHasArticle = await databaseApi.doesArticleForPlayerExist(selectedArticle.player_id);
        if (playerHasArticle) {
            await databaseApi.deleteArticleFromDatabase(playersArticle.id);
        }
        ;
        playersArticle = selectedArticle;
        playersArticle.id = await databaseApi.addArticleToDatabase(playersArticle);
        console.log(player.screenname, "selected article", playersArticle);
        io.to(socket.id).emit("articleRegistered", playersArticle);
    });
    socket.on("playerReady", async () => {
        player.is_ready = true;
        await databaseApi.updatePlayer(player);
        const gameReady = await databaseApi.readyCheck(player.game_id);
        if (gameReady) {
            await roundStart(player.game_id);
            // player = await databaseApi.getPlayerObject(player.id);
            await pushActiveArticle();
            await pushPlayerList();
            io.to(roomCode).emit("roundStarting");
        }
    });
    socket.on("readyForNextRound", async () => {
        const winner = await winnerCheck(player.game_id);
        console.log("the winner is", winner);
        if (winner === undefined) {
            if (player.is_honest) {
                io.to(player.socket_id).emit("youAreNextInterrogator");
            }
        }
        else {
            io.to(roomCode).emit("gameOver", winner);
        }
    });
    socket.on("newInterrogatorReady", () => {
        io.to(roomCode).emit("newRoundStarting");
    });
    socket.on("disconnect", async (reason) => {
        console.log("Socket has disconnected:", socket.id, reason);
        player.is_connected = false;
        console.log(JSON.stringify(player));
        if (player.game_id !== undefined) {
            console.log("Player was assigned to a game. handling disconnect.");
            await handleDisconnect(player, socket, roomCode);
            await pushPlayerList();
        }
        else
            console.log("Player was not assigned to a game.");
    });
    async function pushPlayerList() {
        const playerList = await databaseApi.getAllConnectedPlayers(player.game_id);
        player = playerList.filter(p => p.id === player.id)[0];
        io.to(roomCode).to(socket.id).emit("deliveringPlayerList", playerList);
    }
    async function pushGameData() {
        const activeGame = await databaseApi.getGameObject(player.game_id);
        io.to(socket.id).emit('deliveringGameData', activeGame);
    }
    async function pushActiveArticle() {
        const honestPlayer = await databaseApi.getHonestPlayer(player.game_id);
        const activeArticleId = await databaseApi.getArticleIdFromPlayerId(honestPlayer.id);
        const activeArticle = await databaseApi.getArticleObject(activeArticleId);
        io.to(socket.id).emit('deliveringActiveArticle', activeArticle);
    }
    async function generateArticleOptions() {
        const numberOfOptions = await databaseApi.getGameMaxArticles(player.game_id);
        let articleOptions = [];
        for (let i = 0; i < numberOfOptions; i++) {
            const randomResults = await fetchRandomArticle();
            const article = {
                id: undefined,
                player_id: player.id,
                wiki_id: randomResults.id,
                title: randomResults.title,
            };
            articleOptions.push(article);
        }
        return articleOptions;
    }
    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});
async function handleDisconnect(player, socket, roomCode) {
    player.is_connected = false;
    await databaseApi.updatePlayer(player);
    const gameEmpty = await databaseApi.isGameEmpty(player.game_id);
    if (gameEmpty) {
        console.log("empty game will be deleted.");
        await databaseApi.deleteGameFromDatabase(player.game_id);
    }
    else {
        console.log("player left a non-empty game");
        io.to(roomCode).emit("playerLeft");
        socket.leave(roomCode);
        if (player.is_host) {
            // assignRandomHost();
        }
        if (player.is_interrogator || player.is_honest) {
            // endRoundEarly();
        }
    }
    ;
}
async function roundStart(gameId) {
    await assignGameRoles(gameId);
    let game = await databaseApi.getGameObject(gameId);
    game.current_round++;
    await databaseApi.updateGame(game);
}
async function winnerCheck(gameId) {
    const game = await databaseApi.getGameObject(gameId);
    const playerList = await databaseApi.getAllPlayerObjects(gameId);
    const scoreWinners = playerList.filter(p => p.score >= game.max_score);
    if (scoreWinners.length > 0) {
        return scoreWinners[0];
    }
    else if (game.current_round === game.max_rounds) {
        return playerList.sort((a, b) => b.score - a.score)[0];
    }
    else {
        return undefined;
    }
}
async function assignGameRoles(gameId) {
    let playerList = await databaseApi.getAllPlayerObjects(gameId);
    let interrogator = playerList.find(player => player.is_honest) ?? playerList[Math.floor(Math.random() * playerList.length)];
    let candidates = playerList.filter(player => player.id !== interrogator.id);
    const honestPlayer = candidates[Math.floor(Math.random() * candidates.length)];
    let liars = candidates.filter(player => player.id !== honestPlayer.id);
    for (const player of liars) {
        await databaseApi.setPlayerInterrogator(gameId, player.id, false);
        await databaseApi.setPlayerHonest(gameId, player.id, false);
    }
    await databaseApi.setPlayerHonest(gameId, honestPlayer.id, true);
    await databaseApi.setPlayerHonest(gameId, interrogator.id, false);
    await databaseApi.setPlayerInterrogator(gameId, interrogator.id, true);
    await databaseApi.setPlayerInterrogator(gameId, honestPlayer.id, false);
}
httpServer.listen(3666);
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
async function createNewGame(initOptions, firstPlayer) {
    const gameId = await databaseApi.addGameToDatabase(initOptions.gameOptions);
    firstPlayer.game_id = gameId;
    firstPlayer.is_connected = true;
    const roomCode = await databaseApi.getRoomCode(gameId);
    const playerId = await databaseApi.addPlayerToGame(roomCode, firstPlayer);
    firstPlayer.id = playerId;
    firstPlayer.is_host = true;
    await databaseApi.setPlayerHost(gameId, playerId, true);
    return [firstPlayer, roomCode];
}
