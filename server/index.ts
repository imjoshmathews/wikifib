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
        score: undefined,
        is_host: undefined,
        is_interrogator: undefined,
        is_honest: undefined,
        is_connected: true,
    }

    let article: Article = {
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
            io.to(socket.id).emit("gameCreated",roomCode, player);
            io.to(socket.id).emit("playerUpdated",true,player);
            socket.join(roomCode);
            console.log(socket.rooms);
        } else { io.to(player.socket_id).emit("errorSocketIdNotUnique"); }
    });
    socket.on("requestPlayerList", async() => {
        const playerList = await databaseApi.getAllPlayerObjects(player.game_id);
        io.to(roomCode).to(socket.id).emit("deliveringPlayerList", playerList);
    })
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
            player.screenname = screenname;
            player.game_id = await databaseApi.getGameIdFromRoomCode(roomCode);
            player.id = await databaseApi.addPlayerToGame(roomCode, player);
            socket.join(roomCode);
            socket.to(roomCode).emit("playerJoined",player);
            io.to(socket.id).emit("youJoined", roomCode, player)
        }
    });
    socket.on("startGame", () => {
        io.to(roomCode).emit("gameStarted");
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
    socket.on("guessPlayer", async (guessedPlayer: Player) => {
        if(player.is_interrogator){
            guessedPlayer.score += 1;
            if(guessedPlayer.is_honest) {
                player.score += 2;
            }
            await databaseApi.updatePlayer(guessedPlayer);
            await databaseApi.updatePlayer(player);
            io.to(roomCode).emit("playerGuessed");
        } else {io.to(player.socket_id).emit("errorNotInterrogator")}
    });
    socket.on("promotePlayerToHost", async (player: Player) => {
        if(player.is_host){
            const oldHost: Player = await databaseApi.getHost(player.game_id);
            databaseApi.setPlayerHost(oldHost.game_id,oldHost.id,false);
            databaseApi.setPlayerHost(player.game_id, player.id, true);
        } else {io.to(player.socket_id).emit("errorNotHost")}
    });
    socket.on("selectedArticle", async (selectedArticle: Article) => {
        const playerHasArticle = await databaseApi.doesArticleForPlayerExist(selectedArticle.player_id);
        if(playerHasArticle){ await databaseApi.deleteArticleFromDatabase(article.id); };
        article = selectedArticle;
        article.id = await databaseApi.addArticleToDatabase(article);
        console.log(player.screenname,"selected article",article);
        io.to(socket.id).emit("articleRegistered", article);
    });
    socket.on("disconnect", (reason: DisconnectReason) => {
        console.log("Socket has disconnected:", socket.id,reason);
        pushPlayerList(player, roomCode);
        if(typeof player.game_id !== undefined) { playerExit(player, socket, roomCode) };
    });
    
    //io.on("shuffleArticles", () => {})
    //io.on("kickPlayer", () => {})
});

async function playerExit(player: Player, socket: Socket, roomCode: string){
    await databaseApi.deletePlayerFromDatabase(player.id);
    const gameEmpty: boolean = await databaseApi.isGameEmpty(player.game_id);
    // if(gameEmpty) { console.log("empty game will be deleted."); 
    // await databaseApi.deleteGameFromDatabase(player.game_id); }
    // else {
        io.to(roomCode).emit("playerLeft", player.screenname);
        const playerList = await databaseApi.getAllPlayerObjects(player.game_id);
        io.to(roomCode).emit("deliveringPlayerList", playerList);
        socket.leave(roomCode);
        if(player.is_host){
            // assignRandomHost();
        }
        if(player.is_interrogator || player.is_honest){
            // endRoundEarly();
        }
    // };
}

async function pushPlayerList(player, roomCode){
    const playerList = await databaseApi.getAllPlayerObjects(player.game_id);
    console.log(playerList);
    io.to(roomCode).emit("deliveringPlayerList", playerList);
}

// async function gameStart(gameId: number): Promise<Game>{
//     let game: Game = await databaseApi.getGameObject(gameId);
//     io.to(game.room_code).emit('gameStarted')
//     game.current_round++;
// }

async function roundStart() {

}

async function assignHonestPlayer(gameId: number){
    const playerList: Array<Player> = await databaseApi.getAllPlayerObjects(gameId);
    let candidates: Array<Player> = [];
    for (const player of playerList) {
        if (!player.is_honest){
            candidates.push(player);
        } else {
            databaseApi.setPlayerInterrogator(player.game_id, player.id, true);
            databaseApi.setPlayerHonest(player.game_id,player.id,false);
        }  
    }
    const honestPlayer = candidates[Math.floor(Math.random() * candidates.length)];
    for (const player of candidates) {
        databaseApi.setPlayerInterrogator(player.game_id, player.id, false);
        if(player === honestPlayer){ databaseApi.setPlayerHonest(player.game_id,player.id,true); }
    }
}

async function initPlayer(roomCode: string, player: Player) {
    await databaseApi.addPlayerToGame(roomCode, player);
    generatePlayerArticles(player);
};

httpServer.listen(3666);

const defaultOptions: GameOptions = {
    max_score: 10,
    max_articles: 3,
    max_rounds: 5,
}

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

async function generatePlayerArticles(player: Player): Promise<Array<any>>{
    const playerId: number = await databaseApi.getPlayerIdFromSocketId(player.socket_id);
    const gameId: number = await databaseApi.getGameIdFromPlayerId(playerId);
    const maxArticles: number = await databaseApi.getGameMaxArticles(gameId);
    let articleOptions: Array<any> = [];
    for(let i=0; i < maxArticles; i++){
        const randomResults: RandomResults = await fetchRandomArticle();
        await articleOptions.push(randomResults);
    } 
    await io.to(player.socket_id).emit('sentArticleOptions',{options:articleOptions});
    return articleOptions;
}

async function createNewGame(initOptions: InitOptions, firstPlayer: Player): Promise<Array<any>>{
    const gameId: number = await databaseApi.addGameToDatabase(initOptions.gameOptions);
    firstPlayer.game_id = gameId;
    const roomCode: string = await databaseApi.getRoomCode(gameId);
    const playerId: number = await databaseApi.addPlayerToGame(roomCode, firstPlayer);
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

// test();