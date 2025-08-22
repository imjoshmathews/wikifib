import { reactive } from "vue";
import { io } from "socket.io-client";

export const state = reactive({
  connected: false,
  gameEvents: [],
  barEvents: [],
  roomCode: 'undefined',
  inLobby: false,
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


// inbound events
socket.on("gameCreated", (rc) => {
  console.log("game created with room code",rc);
  state.roomCode = rc;
  state.inLobby = true;
})
socket.on("playerUpdated", (affectsMe, playerData) => {
  console.log("Player updated");
  console.log("was it you?",affectsMe);
  console.log(playerData);
})


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
socket.on("playerJoined", (player) => {console.log(player);})
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