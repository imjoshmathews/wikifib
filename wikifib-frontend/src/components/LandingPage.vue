<script setup>
  import { socket } from '@/socket';
  import {ref} from 'vue';
  const name = ref('');
  const maxScore = ref(9999);
  const maxArticles = ref(3);
  const maxRounds = ref(15);
  const roomCode = ref('');
  const Modes = {
      JoinGame: Symbol("join"),
      CreateGame: Symbol("create"),
  }
  const currentMode = ref(Modes.JoinGame);
  const inJoinMode = ref(currentMode === Modes.JoinGame);

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
    padding: 16px;
  }
  .submit {
    margin: 16px;
    width: 60%;
    height: 5%;
    box-shadow:  #FFFFFF;
  }
  .reminder {
    font-style: italic;
    font-size: small;
  }
  .mode-select {
    border-radius: 0;
    min-width: 100px;
    width: 20%;
    padding: 10px;
    font-size: small;
  }
  .msleft {
    border-top-left-radius: 32px;
    border-bottom-left-radius: 32px;
  }
  .msright {
    border-top-right-radius: 32px;
    border-bottom-right-radius: 32px;
  }
  .activemode {
    background-color: #44CCFF;
    text-align: center;
    -webkit-animation: glow 1s ease-in-out infinite alternate;
    -moz-animation: glow 1s ease-in-out infinite alternate;
    animation: glow 1s ease-in-out infinite alternate;
    z-index: 2;
    -webkit-transition: all 0.25s linear;
    -moz-transition: all 0.25s linear;
    -o-transition: all 0.25s linear;
    transition: all 0.25s linear;

  }
  .inactivemode {
    background-color: #404040;
    color: rgb(255,255,255,0.2);
    font-weight: bold;
    z-index: 1;
    -webkit-transition: all 0.25s linear;
    -moz-transition: all 0.25s linear;
    -o-transition: all 0.25s linear;
    transition: all 0.25s linear;
  }
  .roomcode {
    height: 64px;
    font-size: 48px;
    width: 256px;
    text-transform: uppercase;
    font-weight: bold;
    outline-style: none;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
  }
  @keyframes glow {
    from {
        box-shadow: 0 0 05px #44CCFF, 0 0 10px #44CCFF
    }
    to {
        box-shadow:  0 0 10px #44CCFF, 0 0 15px #44CCFF
    }
  }
</style>

<template>
  <div class="center-aligned">
    <label for="screenname">Name</label><br>
    <input class="textinput" type="text" minlength="1" maxlength="30" id="screenname" name="screenname" v-model="name"/><br>
    <p class="reminder">Note: This game works best when players use their real names!</p>
    <br>
      <button :class="{activemode: (currentMode===Modes.JoinGame), inactivemode: (currentMode!==Modes.JoinGame)}" class="mode-select msleft" @click="currentMode=Modes.JoinGame">JOIN</button>
    <button :class="{activemode: (currentMode===Modes.CreateGame), inactivemode: (currentMode!==Modes.CreateGame)}" class="mode-select msright" @click="currentMode=Modes.CreateGame">CREATE</button><div v-if="currentMode===Modes.JoinGame" class="create-game-box">
      <h2 class="subheader">JOIN A GAME</h2><br>
      <form @submit.prevent="joinGame">
        <label for="roomCode">Room Code </label><br>
        <input class="textinput roomcode" type="text" minlength="5" maxlength="5" id="roomCode" name="roomCode" v-model="roomCode"/><br>
        <button class="submit" type="submit">Join Game</button>
      </form>
    </div>
    <div v-if="currentMode===Modes.CreateGame" class="create-game-box">
      <h2 class="subheader">CREATE A GAME</h2><br>
      <form @submit.prevent="createGame">
        <label for="maxScore">Max Score </label>
        <input type="number" id="maxScore" name="maxScore" min="10" max="10000" v-model="maxScore"><br>
        <label for="maxRounds">Max Rounds </label>
        <input type="number" id="maxRounds" name="maxRounds" min="1" max="1000" v-model="maxRounds"><br>
        <label for="maxArticles">Number of Articles to Choose From </label>
        <input type="number" id="maxArticles" name="maxArticles" min="1" max="5" v-model="maxArticles"><br>
        <button class="submit" type="submit">Create Game</button>
      </form>
    </div>
    <br>
  </div>
</template>