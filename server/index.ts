import * as databaseApi from './databaseApi';
import * as constants from './const';
import { createServer } from "http";
import { DisconnectReason, Server, Socket } from "socket.io";
import {QueryParams, InitOptions, Article, GameOptions, WikiQueryResults, Player, Game, RandomResults} from './interfaces';
import { json } from 'stream/consumers';

const httpServer = createServer();
const io = new Server(httpServer, {
    pingTimeout: 30000,
    connectionStateRecovery: {},
    cors: {
        origin: "*",
    }
});
const wikiApiRoot: string = constants.wikiApiRoot;
const roomCodeLength: number = constants.roomIdLength;
const defaultParams: QueryParams = constants.defaultParams;

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


async function sanityCheck(){
    console.log("Sanity Check");
}
sanityCheck();

io.on("connection", (socket: Socket) => {
    //sanityCheck();
    console.log('Socket has connected:',socket.id);

    let player: Player = {
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
    }

    let playersArticle: Article = {
        id: undefined,
        player_id: undefined,
        wiki_id: undefined,
        title: undefined,
    }

    let activeArticle: Article = {
        id: undefined,
        player_id: undefined,
        wiki_id: undefined,
        title: undefined,
    }


    let roomCode: string;

    socket.on("createGame", async (initOptions: InitOptions) => {
        const socketIdUnique = await databaseApi.isSocketIdUnique(socket.id);
        console.log(socketIdUnique);
        if(socketIdUnique){
            console.log("Game create emit received");
            console.log(JSON.stringify(initOptions));
            player.screenname = initOptions.hostScreenname;
            const newGameOutput = await createNewGame(initOptions, player);
            player = newGameOutput[0];
            roomCode = newGameOutput[1];
            await io.to(socket.id).emit("playerUpdated",player);
            await io.to(socket.id).emit("gameCreated",roomCode, player);
            socket.join(roomCode);
            console.log(socket.rooms);
        } else { io.to(player.socket_id).emit("errorSocketIdNotUnique"); }
    });

    socket.on("joinGame", async (rawRoomCode: string, screenname: string) => {
        const socketIdUnique = await databaseApi.isSocketIdUnique(socket.id);
            if(rawRoomCode === null){io.to(player.socket_id).emit("errorNoRoomCodeProvided");
                return;
            };
            roomCode = rawRoomCode.toUpperCase();
            const roomExists = await databaseApi.doesRoomCodeExist(roomCode);
            if(!roomExists){
                io.to(player.socket_id).emit("errorNoRoomFound");
                return;
            } else if(!socketIdUnique){
                io.to(player.socket_id).emit("errorSocketIdNotUnique");
                return;
            } else{
                const gameId = await databaseApi.getGameIdFromRoomCode(roomCode);
                const game = await databaseApi.getGameObject(gameId);
                if(!game.game_started){
                    player.screenname = screenname;
                    player.game_id = gameId;
                    player.is_connected = true;
                    player.id = await databaseApi.addPlayerToGame(roomCode, player);
                    socket.join(roomCode);
                    await io.to(socket.id).emit("playerUpdated",player);
                    await io.to(socket.id).emit("youJoined", roomCode, player);
                    socket.to(roomCode).emit("playerJoined");
                } else {io.to(socket.id).emit("errorGameAlreadyStarted"); }
            } 
    });

    socket.on("playerReconnecting", async (loadedRoomCode: string, loadedPlayer: Player) => {
        const gameExists = await databaseApi.doesGameExist(loadedPlayer.game_id);
        if(gameExists) {
            roomCode = loadedRoomCode;
            socket.join(roomCode);
            player = loadedPlayer;
            player.socket_id = socket.id;
            await databaseApi.updatePlayer(player);
            const honestPlayer = await databaseApi.getHonestPlayer(player.game_id);
            const activeArticleId = await databaseApi.getArticleIdFromPlayerId(honestPlayer.id);
            activeArticle = await databaseApi.getArticleObject(activeArticleId);
            await pushPlayerList();
            await pushActiveArticle();
            await pushGameData();
            io.to(roomCode).emit('playerRejoined');
        } else io.to(socket.id).emit('errorGameNoLongerExists');
    })

    socket.on("startGame", async () => {
        let game = await databaseApi.getGameObject(player.game_id);
        if(game.game_started){
            io.to(socket.id).emit("errorGameStarted");
        }
        else{ 
            game.game_started = true;
            await databaseApi.updateGame(game);
            io.to(roomCode).emit("gameStarted");
        }
    });

    socket.on("leaveGame", () => {
        playerExit(player, socket, roomCode);
    });

    socket.on("endGame", async (roomCode: string) => {
        if(player.is_host){
            const gameId: number = await databaseApi.getGameIdFromRoomCode(roomCode);
            await databaseApi.deleteGameFromDatabase(gameId);
            io.to(roomCode).emit("gameEnded");
        } else {io.to(player.socket_id).emit("errorNotHost")}
    });

    socket.on("requestPlayerList", async () => { pushPlayerList(); })
    socket.on("requestActiveArticle", async () => { pushActiveArticle(); })
    socket.on("requestGameData", async () => { pushGameData(); })
    socket.on("requestArticleOptions", async() => {

        const numberOfOptions: number = await databaseApi.getGameMaxArticles(player.game_id);
        let articleOptions: Array<Article> = [];
        for(let i=0; i<numberOfOptions; i++){
            const randomResults: RandomResults = await fetchRandomArticle();
            const article: Article = {
                id: undefined,
                player_id: player.id,
                wiki_id: randomResults.id,
                title: randomResults.title,
            }
            articleOptions.push(article);
        }
        console.log(articleOptions);
        io.to(socket.id).emit("deliveringArticleOptions", articleOptions);
    })



    socket.on("guessPlayer", async (guessedPlayer: Player) => {
        guessedPlayer.score += constants.gotGuessedScore;
        if(guessedPlayer.is_honest) {
            player.score += constants.correctGuessScore;
            guessedPlayer.is_ready = false;
        } else {
            let honestPlayer = await databaseApi.getHonestPlayer(player.game_id);
            honestPlayer.is_ready = false;
            await databaseApi.updatePlayer(honestPlayer);
        }
        await databaseApi.updatePlayer(guessedPlayer);
        await databaseApi.updatePlayer(player);
        io.to(roomCode).emit("playerGuessed", guessedPlayer);
    });

    socket.on("promotePlayerToHost", async (player: Player) => {
        if(!player.is_host){
            io.to(player.socket_id).emit("errorNotHost");
            return;
        }
        const oldHost: Player = await databaseApi.getHost(player.game_id);
        databaseApi.setPlayerHost(oldHost.game_id,oldHost.id,false);
        databaseApi.setPlayerHost(player.game_id, player.id, true);
        io.to(player.socket_id).emit("playerUpdated");
        io.to(oldHost.socket_id).emit("playerUpdated");
    });
    
    socket.on("selectedArticle", async (selectedArticle: Article) => {
        const playerHasArticle = await databaseApi.doesArticleForPlayerExist(selectedArticle.player_id);
        if(playerHasArticle){ await databaseApi.deleteArticleFromDatabase(playersArticle.id); };
        playersArticle = selectedArticle;
        playersArticle.id = await databaseApi.addArticleToDatabase(playersArticle);
        console.log(player.screenname,"selected article",playersArticle);
        io.to(socket.id).emit("articleRegistered", playersArticle);
    });

    socket.on("playerReady", async () => {
        player.is_ready = true;
        await databaseApi.updatePlayer(player);
        const winner = await winnerCheck(player.game_id);
        console.log("the winner is", winner);
        if(winner === undefined){
            const gameReady = await databaseApi.readyCheck(player.game_id);
            if(gameReady){
                await roundStart(player.game_id);
                // player = await databaseApi.getPlayerObject(player.id);
                await pushActiveArticle();
                await pushPlayerList();
                io.to(roomCode).emit("roundStarting")
            }
        } else {
            io.to(roomCode).emit("gameOver", winner);
        }
    });

    socket.on("readyForNextRound", () => {
        io.to(roomCode).emit("newRoundStarting");
    })

    socket.on("disconnect", (reason: DisconnectReason) => {
        console.log("Socket has disconnected:", socket.id,reason);
        player.is_connected = false;
        console.log(JSON.stringify(player));
        if(player.game_id !== undefined) { 
            console.log("Player was assigned to a game. handling disconnect.");
            handleDisconnect(player, socket, roomCode);
            pushPlayerList();
        } else console.log("Player was not assigned to a game.");
    });
    
    async function pushPlayerList() {
        const playerList = await databaseApi.getAllConnectedPlayers(player.game_id);
        player = playerList.filter(p => p.id === player.id)[0];
        io.to(roomCode).to(socket.id).emit("deliveringPlayerList", playerList);
    }

    async function pushGameData() {
        const activeGame: Game = await databaseApi.getGameObject(player.game_id);
        io.to(socket.id).emit('deliveringGameData', activeGame);
    }

    async function pushActiveArticle() {
        const honestPlayer = await databaseApi.getHonestPlayer(player.game_id);
        const activeArticleId = await databaseApi.getArticleIdFromPlayerId(honestPlayer.id);
        const activeArticle = await databaseApi.getArticleObject(activeArticleId);
        io.to(socket.id).emit('deliveringActiveArticle', activeArticle);
    }



    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});

async function handleDisconnect(player: Player, socket: Socket, roomCode: string){
    player.is_connected = false;
    await databaseApi.updatePlayer(player);
    const gameEmpty: boolean = await databaseApi.isGameEmpty(player.game_id);
    if(gameEmpty) {
        console.log("empty game will be deleted."); 
        await databaseApi.deleteGameFromDatabase(player.game_id);
    } else {
        console.log("player left a non-empty game")
        io.to(roomCode).emit("playerLeft");
        socket.leave(roomCode)
        if(player.is_host){
            // assignRandomHost();
        }
        if(player.is_interrogator || player.is_honest){
            // endRoundEarly();
        }
    };
}

async function playerExit(player: Player, socket: Socket, roomCode: string){
    await databaseApi.deletePlayerFromDatabase(player.id);
    const gameEmpty: boolean = await databaseApi.isGameEmpty(player.game_id);
    if(gameEmpty) {
        console.log("empty game will be deleted."); 
        await databaseApi.deleteGameFromDatabase(player.game_id);
    }
    // else {
        io.to(roomCode).emit("playerLeft", player.screenname);
        socket.leave(roomCode)
        if(player.is_host){
            // assignRandomHost();
        }
        if(player.is_interrogator || player.is_honest){
            // endRoundEarly();
        }
    // };
}

async function roundStart(gameId: number) {
    await assignGameRoles(gameId);
    let game = await databaseApi.getGameObject(gameId);
    game.current_round++;
    await databaseApi.updateGame(game);
}

async function winnerCheck(gameId: number): Promise<Player|undefined>{
    const game = await databaseApi.getGameObject(gameId);
    const playerList = await databaseApi.getAllPlayerObjects(gameId);
    const scoreWinners = playerList.filter(p => p.score >= game.max_score);
    if(scoreWinners.length>0){
        return scoreWinners[0];
    } else if(game.current_round === game.max_rounds) {
        return playerList.sort((a, b) => b.score - a.score)[0]; 
    } else { return undefined; }
}


async function oldAssignGameRoles(gameId: number){
    let playerList: Array<Player> = await databaseApi.getAllPlayerObjects(gameId);
    let candidates: Array<Player> = [];
    let interrogator: Player = undefined;
    for (const player of playerList) {
        if (!player.is_honest){
            candidates.push(player);
        } else {
            await databaseApi.setPlayerInterrogator(player.game_id, player.id, true);
            await databaseApi.setPlayerHonest(player.game_id,player.id,false);
            interrogator = player;
        }
    } if(interrogator === undefined){
        let index: number = Math.floor(Math.random() * candidates.length);
        interrogator = candidates[index];
        candidates.splice(index,1);
    }
    const newHonestPlayer: Player = candidates[Math.floor(Math.random() * candidates.length)];
    for (const player of candidates) {
        await databaseApi.setPlayerInterrogator(player.game_id, player.id, false);
        if(player === newHonestPlayer){ 
            await databaseApi.setPlayerHonest(player.game_id,player.id,true);
        }
    }
}

async function assignGameRoles(gameId: number){
    let playerList: Array<Player> = await databaseApi.getAllPlayerObjects(gameId);
    let interrogator: Player = playerList.find(player => player.is_honest) ?? playerList[Math.floor(Math.random() * playerList.length)];
    let candidates: Array<Player> = playerList.filter(player => player.id!==interrogator.id);
    const honestPlayer: Player = candidates[Math.floor(Math.random() * candidates.length)];
    let liars: Array<Player> = candidates.filter(player => player.id!==honestPlayer.id);
    for (const player of liars){
        await databaseApi.setPlayerInterrogator(gameId,player.id,false);
        await databaseApi.setPlayerHonest(gameId,player.id,false);
    }
    await databaseApi.setPlayerHonest(gameId, honestPlayer.id, true);
    await databaseApi.setPlayerHonest(gameId, interrogator.id, false);
    await databaseApi.setPlayerInterrogator(gameId,interrogator.id,true);
    await databaseApi.setPlayerInterrogator(gameId,honestPlayer.id,false);
}

httpServer.listen(3666);

function stringifyWikiQuery(params: QueryParams): string {
    let url: string = wikiApiRoot + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];})
    return url;
}
async function fetchRandomArticle(): Promise<RandomResults> {
    const response: Response = await fetch(stringifyWikiQuery(defaultParams));
    const wikiQueryResults: WikiQueryResults = await response.json();
    const randomResults = wikiQueryResults.query.random[0];
    return randomResults;
}

async function createNewGame(initOptions: InitOptions, firstPlayer: Player): Promise<Array<any>>{
    const gameId: number = await databaseApi.addGameToDatabase(initOptions.gameOptions);
    firstPlayer.game_id = gameId;
    firstPlayer.is_connected = true;
    const roomCode: string = await databaseApi.getRoomCode(gameId);
    const playerId: number = await databaseApi.addPlayerToGame(roomCode, firstPlayer);
    firstPlayer.id = playerId;
    firstPlayer.is_host = true;
    await databaseApi.setPlayerHost(gameId, playerId, true);
    return [firstPlayer, roomCode];
}