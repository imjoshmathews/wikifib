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
  const inLobby = () => {return state.inLobby}

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

<template>
  <h1>welcome to wikifib, {{ name }}</h1>
  <!-- <p v-if="status === 'active'">User is Active</p>
  <p v-else-if="status === 'pending'">User is pending</p>
  <p v-else>User is brrrroken</p>
  <h3>Players:</h3>
    <ul>
      <li v-for="player in players" :key="player">{{ player }}</li>
    </ul>  
  <br> -->
<br>
<label for="screenname">Screenname</label>
<input type="text" minlength="1" maxlength="30" id="screenname" name="screenname" v-model="name"/><br>
<br>
<RoomCodeDisplay v-if="inLobby()"/>
  <h2>CREATE A GAME</h2>
  <form @submit.prevent="createGame()">

    <label for="maxScore">Max Score</label>
    <input type="number" id="maxScore" name="maxScore" min="5" max="100" v-model="maxScore"><br>
    
    <label for="maxRounds">Max Rounds</label>
    <input type="number" id="maxRounds" name="maxRounds" min="1" max="20" v-model="maxRounds"><br>
    
    <label for="maxArticles">Number of Articles to Choose From</label>
    <input type="number" id="maxArticles" name="maxArticles" min="1" max="5" v-model="maxArticles"><br>
    
    <button type="submit">Create Game</button>
  </form>
<br><br>
  <h2>OR JOIN A GAME</h2>
  <form @submit.prevent="joinGame">
    <label for="roomCode">Room Code</label>
    <input type="text" minlength="5" maxlength="5" id="roomCode" name="roomCode" v-model="roomCode"/>
    <button type="submit">Join Game</button>
  </form>
</template>