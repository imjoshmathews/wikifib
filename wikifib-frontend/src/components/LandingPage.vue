<script setup>
  import { socket } from '@/socket';
  import {ref} from 'vue';
  const name = ref('');
  const maxScore = ref(100);
  const maxArticles = ref(1);
  const maxRounds = ref(10);
  const roomCode = ref('');
  const Modes = {
      JoinGame: Symbol("join"),
      CreateGame: Symbol("create"),
  }
  const currentMode = ref(Modes.JoinGame);

  const createGame = async () => {
      if(name.value.trim() !== ''){
          const gameOptions = {
              max_score: maxScore.value,
              max_articles: maxArticles.value,
              max_rounds: maxRounds.value,
          }
          const initOptions = {hostScreenname:name.value,gameOptions:gameOptions};
          console.log("create game fired")
          socket.emit("createGame", initOptions);
      } else alert("Your name cannot be empty!");
  }
  const joinGame = async () => {
      if(name.value.trim() !== ''){
          await socket.emit("joinGame", roomCode.value, name.value);
      } else alert("Your name cannot be empty!");
  }
</script>

<style>
  .subheader {
    /* color: white; */
    text-align: center;
  }
  .create-game-box {
    line-height:normal;
  }
</style>

<template>
  <div class="center-aligned">
    <label for="screenname">Name</label><br>
    <input type="text" minlength="1" maxlength="30" id="screenname" name="screenname" v-model="name"/><br>
    <div v-if="currentMode===Modes.JoinGame" class="create-game-box">
      <h2 class="subheader">JOIN A GAME</h2><br>
      <form @submit.prevent="joinGame">
        <label for="roomCode">Room Code </label><br>
        <input type="text" minlength="5" maxlength="5" id="roomCode" name="roomCode" v-model="roomCode"/><br>
        <button type="submit">Join Game</button>
      </form>
    </div>
    <div v-if="currentMode===Modes.CreateGame" class="create-game-box">
      <h2 class="subheader">CREATE A GAME</h2><br>
      <form @submit.prevent="createGame">
        <label for="maxScore">Max Score </label>
        <input type="number" id="maxScore" name="maxScore" min="5" max="100" v-model="maxScore"><br>
        <label for="maxRounds">Max Rounds </label>
        <input type="number" id="maxRounds" name="maxRounds" min="1" max="20" v-model="maxRounds"><br>
        <label for="maxArticles">Number of Articles to Choose From </label>
        <input type="number" id="maxArticles" name="maxArticles" min="1" max="5" v-model="maxArticles"><br>
        <button type="submit">Create Game</button>
      </form>
    </div>
    <br>
    <button @click="currentMode=Modes.JoinGame">JOIN</button>
    <button @click="currentMode=Modes.CreateGame">CREATE</button>
  </div>
</template>