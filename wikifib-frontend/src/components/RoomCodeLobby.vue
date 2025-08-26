<script setup>
    import {state, socket} from '@/socket';
    const playerSelf = () => { return state.playerSelf };
    const roomCode = () => {return state.roomCode };
    const playerList = () => {return state.playerList};
    const startGame = () => {
        socket.emit("startGame");
    }
</script>

<style>
    .boxy {
        text-align: center;
    }
    .rc {
        font-size: xx-large;
        font-weight: bold;
    }
    .players-list {
        list-style: none;
        padding: 1rem;
    }
    .player {
    }
    @-webkit-keyframes glow {
    from {
        text-shadow: 0 0 05px #fff, 0 0 10px #fff, 0 0 15px #0023e6, 0 0 20px #0023e6, 0 0 25px #0023e6, 0 0 30px #0023e6, 0 0 45px #0023e6;
    }
    to {
        text-shadow: 0 0 10px #fff, 0 0 15px #4db8ff, 0 0 25px #4db8ff, 0 0 30px #4db8ff, 0 0 40px #4db8ff, 0 0 50px #4db8ff, 0 0 60px #4db8ff;
    }
}
</style>

<template>
    <div class="boxy">
        <p>Your Room Code is</p>
        <h1 class="rc">{{ roomCode() }}</h1>
        <p>Invite your friends to join you by heading over to wikifib.com and entering this code!</p>
        <br>
        <h2 v-if="playerList().length<1">Waiting for at least 3 players...</h2>
        <div v-else>
        <span v-if="playerSelf().is_host">
            <h2>You are the host!</h2>
            <button v-if="playerSelf().is_host" @click="startGame">Start Game</button>
        </span>
        <span v-else>
            <h2>Waiting for the host to start the game...</h2>
        </span>
        <br>
        </div>
    <ul class="players-list">
        <h4>PLAYERS:</h4>
        <li class="player" v-for="player in playerList()" :key="player">{{player.screenname}}</li>
    </ul>
    </div>
</template>