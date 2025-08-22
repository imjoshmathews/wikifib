<script setup>
import {state} from '@/socket';
import { ref } from 'vue';

    // import { defineProps } from 'vue';
    // defineProps({
    //     roomCode: String,
    // });
    const roomCode = () => { return state.roomCode };
    const playerList = () => {return state.playerList};
</script>

<style>
    .boxy {
        text-align: center;
    }
    .rc {
        color: white;
        font-size: xx-large;
        font-weight: bold;
    }
    .players {
        list-style: none;
        padding: 1rem;
        font-size: x-large;
        color: white;
    }
</style>

<template>
    <div class="boxy">
        <p>Your Room Code is</p>
        <h1 class="rc">{{ roomCode() }}</h1>
        <p>Invite your friends to join you by heading over to wikifib.com and entering this code!</p>
        <ul class="players">
            <li v-for="player in playerList()" :key="player">{{player.screenname}}</li>
        </ul>
    </div>
</template>