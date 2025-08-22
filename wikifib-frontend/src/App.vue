<script setup>
  import { socket, state } from './socket';
  import { ref } from 'vue';
  import RoomCodeDisplay from '@/components/RoomCodeDisplay.vue';
  const name = ref('nerd');
  // const status = ref('silly');
  // const players = ref(['Dakota', 'Dustin', 'Hannah']);
  const maxScore = ref(7);
  const maxArticles = ref(2);
  const maxRounds = ref(12);
  const roomCode = ref();
  const inLobby = () => {return state.inLobby};
  const playerList = () => {return state.playerList};

  // const toggleStatus = () => {
  //   if(status.value === 'active'){
  //     status.value = 'pending';
  //   } else if(status.value === 'pending'){
  //     status.value = 'wonky';
  //   } else status.value = 'active';
  // }
  const createGame = async () => {
    if(name.value.trim() !== ''){
    const gameOptions = {
      max_score: maxScore.value,
      max_articles: maxArticles.value,
      max_rounds: maxRounds.value,
    }
    const initOptions = {hostScreenname:name.value,gameOptions:gameOptions};
    console.log("create game fired")
    await socket.emit("createGame", initOptions);
    } else console.log("name cannot be empty")
  }
  const joinGame = async () => {
    await socket.emit("joinGame", roomCode.value, name.value);
  }

</script>

<style>
  .mainHeader {
    /* color: white; */
    text-align: center;
    font-size: 2.5rem;
  }
  .subtitle {
    text-align: center;
    font-size: 1.5rem;
    padding: 0;
  }
  .nameinput {
    text-align: center;
  }
  button {
    padding: 1rem;
    border: none;
    border-radius: 0.5rem;
    text-align: center;
  }
  .createGameBox {
    text-align: center;
    line-height:normal;
  }
  .subHeader {
    /* color: white; */
    text-align: center;
  }
  footer {
    position: absolute;
    bottom: 6px;
    right: 12px;
    font-size: x-small;
    text-align: right;
  }
  input {
    /* color: white; */
    /* background-color: #232323; */
    text-align: center;
    border-radius: 0.5rem;
  }
</style>

<template>
  <h1 class="mainHeader">wikifib</h1>
  <h2 class="subtitle">A party game about learning and lying.</h2>
<br>
<RoomCodeDisplay v-if="inLobby()"/>
<div class="nameinput" v-else>
  <label for="screenname">Screenname</label><br>
<input type="text" minlength="1" maxlength="30" id="screenname" name="screenname" v-model="name"/><br>
<br>
<div class="createGameBox">
  <h2 class="subHeader">JOIN A GAME</h2><br>
  <form @submit.prevent="joinGame">
    <label for="roomCode">Room Code </label>
    <br>
    <input type="text" minlength="5" maxlength="5" id="roomCode" name="roomCode" v-model="roomCode"/><br>

    <button type="submit">Join Game</button>
  </form>
</div>
<br>
<div class="createGameBox">
  <h2 class="subHeader">CREATE A GAME</h2><br>
  <form @submit.prevent="createGame()">

    <label for="maxScore">Max Score </label>
    <input type="number" id="maxScore" name="maxScore" min="5" max="100" v-model="maxScore"><br>
    
    <label for="maxRounds">Max Rounds </label>
    <input type="number" id="maxRounds" name="maxRounds" min="1" max="20" v-model="maxRounds"><br>
    
    <label for="maxArticles">Number of Articles to Choose From </label>
    <input type="number" id="maxArticles" name="maxArticles" min="1" max="5" v-model="maxArticles"><br>
    <button type="submit">Create Game</button>
  </form>
</div>
<br><br>

</div>
<footer>
Inspired by "Two of These People Are Lying" by The Technical Difficulties<br>
© 2025 - Josh Mathews. All Rights Reserved.
</footer>
</template>