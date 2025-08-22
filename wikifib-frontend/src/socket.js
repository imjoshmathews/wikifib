import { reactive } from "vue";
import { io } from "socket.io-client";

export const state = reactive({
  connected: false,

  roomCode: 'undefined',

  onLandingPage: true,
  inLobby: false,
  choosingArticle: false,
  playingGame: false,
  

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
  },

  playersArticle :{
    id: undefined,
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


socket.on("connect", () => {
  state.connected = true;
});
socket.on("disconnect", () => {
  state.connected = false;
});

function initPlayer(roomCode, player){
  state.roomCode = roomCode;
  state.inLobby = true;
  state.playerSelf = player;
}

// inbound events
socket.on("gameCreated", (roomCode, player) => {
  initPlayer(roomCode, player);
  socket.emit("requestPlayerList");
  socket.emit("requestGameInfo");
})

socket.on("deliveringPlayerList", (playerList) => {
  console.log("playerlist delivery!");
  state.playerList = playerList;
  console.log(state.playerList);
})

socket.on("youJoined", (roomCode, player) => {
  initPlayer(roomCode, player);
  socket.emit("requestPlayerList");
})

socket.on("playerJoined", (player) => {
  state.playerList.push(player);
  console.log(state.playerList[1]);
})

socket.on("playerLeft", (name) => {console.log(name);})

socket.on("playerUpdated", (affectsMe, playerData) => {
  console.log("Player updated");
  console.log("was it you?",affectsMe);
  console.log(playerData);
  if(affectsMe){ state.playerSelf = playerData };
  const index = state.playerList.findIndex(player => player.id === playerData.id);
  if(index > -1){state.playerList[index] = playerData}
  else{state.playerList.push(playerData)};
  console.log(state.playerList);
  console.log(state.playerSelf);
})

// function isTargetPlayer(player) {
//   return player.id === 
// }



socket.on("errorSocketIdNotUnique", () => {
  console.log("Player's socket ID is already in a game")
});
socket.on("errorNoRoomFound", () => {
  console.log("No Room Found with that code")
});

socket.on("gameStarted", () => {})
socket.on("sentArticleOptions", (options) => {
  console.log(options);
});
socket.on("activeArticleUpdated", () => {})
socket.on("scoreUpdated", () => {})
socket.on("roundUpdated", () => {})
socket.on("interrogatorUpdated", () => {})

socket.on("playerKicked", () => {})
socket.on("playerPromoted", () => {})
socket.on("playerGuessed", () => {})
socket.on("youAreInterrogator", () => {})
socket.on("youAreNotInterrogator",() => {})
socket.on("youAreHonest", () => {})
socket.on("youAreNotHonest",() => {})

// outbound events
socket.on("createGame", () => {})
socket.on("joinGame", () => {})
socket.on("startGame", () => {})
socket.on("leaveGame", () => {})
socket.on("endGame", () => {})
socket.on("kickPlayer", () => {})
socket.on("guessPlayer", () => {})
socket.on("promotePlayerToHost", () => {})
socket.on("selectArticle", () => {})
socket.on("shuffleArticles", () => {})

socket.on("bar", (...args) => {
  state.barEvents.push(args);
});