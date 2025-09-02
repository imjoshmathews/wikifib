import { reactive } from "vue";
import { io } from "socket.io-client";

export const PageModes = {
  OnLandingPage: 'OnLandingPage',
  InLobby: 'InLobby',
  ChoosingArticle: 'ChoosingArticle',
  ReadingArticle: 'ReadingArticle',
  PlayingGame: 'PlayingGame',
}

export const state = reactive({
  connected: false,
  tutorialWindow: false,
  roundEndWindow: false,

  roomCode: 'undefined',
  frontendMode: PageModes.OnLandingPage,
  game: {
    id: undefined,
    room_code: undefined,
    max_score: undefined,
    max_articles: undefined,
    max_rounds: undefined,
    current_round: undefined,
    game_started: false
  },
  activeArticle: {
    id: undefined,
    player_id: undefined,
    wiki_id: undefined,
    title: undefined,
  },
  playerSelf: {
    id: undefined,
    game_id: undefined,
    socket_id: undefined,
    screenname: undefined,
    score: undefined,
    is_host: undefined,
    is_interrogator: undefined,
    is_honest: undefined,
    is_ready: undefined,
  },
  playersArticle :{
    id: undefined,
    player_id: undefined,
    wiki_id: undefined,
    title: undefined,
  },
  playerList: [],
  articleOptions: [],
});

// "undefined" means the URL will be computed from the `window.location` object
//const URL = process.env.NODE_ENV === "production" ? undefined : "https://dev.wikifib.com";
// const URL = "https://socket.wikifib.com";
//export const socket = io(URL);

export const socket = io("https://socket.wikifib.com",{});

function autosaveSession(){
  sessionStorage.setItem('frontendMode',state.frontendMode);
  sessionStorage.setItem('roomCode',state.roomCode);
  sessionStorage.setItem('playerSelf',JSON.stringify(state.playerSelf));
  sessionStorage.setItem('articleOptions',JSON.stringify(state.articleOptions));
}
function loadSession(){
  if(sessionStorage.getItem('frontendMode')===null) return;
  state.frontendMode = sessionStorage.getItem('frontendMode');
  if(sessionStorage.getItem('roomCode')===null) return;
  state.roomCode = sessionStorage.getItem('roomCode');
  state.playerSelf = JSON.parse(sessionStorage.getItem('playerSelf'));
  if(sessionStorage.getItem('articleOptions')!==null){
    state.articleOptions = JSON.parse(sessionStorage.getItem('articleOptions'));
  }
  socket.emit('playerReconnecting', state.roomCode, state.playerSelf);
}
loadSession();

export function clearSession(){
  sessionStorage.clear();
  window.location.reload(true);
}

export function endRound(){

}

socket.on("connect", () => {
  state.connected = true;
});
socket.on("disconnect", () => {
  state.connected = false;
});

function initPlayer(roomCode, player){
  state.roomCode = roomCode;
  state.frontendMode = PageModes.InLobby;
  state.playerSelf = player;
  autosaveSession();
}

// inbound events
socket.on("gameCreated", (roomCode, player) => {
  initPlayer(roomCode, player);
})

socket.on("deliveringPlayerList", (playerList) => {
  console.log("playerlist delivery!");
  state.playerList = playerList;
  state.playerSelf = playerList.filter(p => p.id === state.playerSelf.id)[0];
  autosaveSession();
})

socket.on("gameStarted", async () => {
  await socket.emit("requestGameData");
  await socket.emit("requestArticleOptions");
});

socket.on("deliveringArticleOptions", (articleOptions) => {
  console.log("article option delivery!");
  state.articleOptions = articleOptions;
  state.frontendMode = PageModes.ChoosingArticle;
  autosaveSession();
})

socket.on("deliveringGameData", (gameData) => {
  state.game = gameData;
})

socket.on("deliveringActiveArticle", (activeArticle) =>{
  state.activeArticle = activeArticle;
})

socket.on("youJoined", (roomCode, player) => {
  initPlayer(roomCode, player);
  socket.emit("requestPlayerList");
})

socket.on("playerJoined", () => {socket.emit("requestPlayerList")})
socket.on("playerRejoined", () => {socket.emit("requestPlayerList")})
socket.on("playerLeft", () => {socket.emit("requestPlayerList")})

socket.on("playerUpdated", (playerData) => {
  console.log("Player updated");
  state.playerSelf = playerData;
  autosaveSession();
})

socket.on("articleRegistered", (returnedArticle) => {
  state.playersArticle = returnedArticle;
})

socket.on("roundStarting", () => {
  socket.emit("requestPlayerList");
  socket.emit("requestActiveArticle");
  socket.emit("requestGameData");
  state.frontendMode = PageModes.PlayingGame; 
  autosaveSession();
})


socket.on("playerGuessed", async (guessedPlayer) => {
  socket.emit("requestPlayerList");
  autosaveSession();
  const correctness = guessedPlayer.is_honest ? "honest" : "a liar"; 
  alert(`The interrogator guessed ${guessedPlayer.screenname} and ${guessedPlayer.screenname} was ${correctness}!`);
  socket.emit("readyForNextRound");
})

socket.on("youAreNextInterrogator", async () => {
  alert("You are the next interrogator. You'll have to read an article before the next round starts. Continue?");
  state.playersArticle = {
    id: undefined,
    player_id: undefined,
    wiki_id: undefined,
    title: undefined,
  };
  await socket.emit("requestArticleOptions");
  socket.emit("newInterrogatorReady");
});

socket.on("newRoundStarting", async () => {
  state.frontendMode = PageModes.ChoosingArticle;
  autosaveSession();
})

socket.on("gameOver", (winner) => {
  if(state.playerSelf.id === winner.id){alert("congrats! you won!");}
  else{alert("sorry, you didn't win this time!")};
  clearSession();
})

socket.on("errorSocketIdNotUnique", () => { alert("ERROR: Player's socket ID is already in a game"); });
socket.on("errorNoRoomFound", () => { alert("ERROR: No room found with that code"); });
socket.on("errorGameAlreadyStarted", () => {alert("ERROR: Game already started :(")});
socket.on("errorGameNoLongerExists", () => {
  alert("ERROR: Game no longer exists!\nReloading page and clearing session storage.");
  clearSession();
})
socket.on("activeArticleUpdated", () => {})
socket.on("scoreUpdated", () => {})
socket.on("roundUpdated", () => {})
socket.on("interrogatorUpdated", () => {})

socket.on("playerKicked", () => {})
socket.on("playerPromoted", () => {})


// outbound events
socket.on("leaveGame", () => {})
socket.on("endGame", () => {})
socket.on("kickPlayer", () => {})
socket.on("guessPlayer", () => {})
socket.on("promotePlayerToHost", () => {})
socket.on("selectArticle", () => {})
socket.on("shuffleArticles", () => {})