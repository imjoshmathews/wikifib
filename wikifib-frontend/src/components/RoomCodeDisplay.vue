<script setup>
import {state} from '@/socket';
import { ref } from 'vue';

    // import { defineProps } from 'vue';
    // defineProps({
    //     roomCode: String,
    // });
    const rc = () => { return state.roomCode };
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
</style>

<template>
    <div class="boxy">
        <p>Your Room Code is</p>
        <h1 class="rc">{{ rc() }}</h1>
        <p>Invite your friends to join you by heading over to wikifib.com and entering this code!</p>
    </div>
</template>