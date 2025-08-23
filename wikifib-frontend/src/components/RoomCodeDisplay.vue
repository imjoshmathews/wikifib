<script setup>
import {state, socket} from '@/socket';
import { ref } from 'vue';

    // import { defineProps } from 'vue';
    // defineProps({
    //     roomCode: String,
    // });
    const roomCode = () => {return state.roomCode };
    const playerList = () => {return state.playerList};
    const articleOptions = () => {return state.articleOptions}
    const requestArticleOptions = async () => {
        const articleOpts = articleOptions();
        console.log(articleOpts);
        if(articleOpts.length===0){
            console.log("Requesting Articles!");
            await socket.emit("requestArticleOptions");
        } else return;
    }
    const iframeUrl = () => {
        let opt = articleOptions();
        let url = "https://en.wikipedia.org/?curid="+opt[0].wiki_id;
        return url;
    }
    //still working on this 
    // +articleOptions[0].wiki_id;
</script>

<style>
    .boxy {
        text-align: center;
    }
    .rc {
        font-size: xx-large;
        font-weight: bold;
    }
    .players {
        list-style: none;
        padding: 1rem;
        font-size: x-large;
        /* color: white; */
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
            <button @click="requestArticleOptions">gimme options</button>
        <span v-if="articleOptions().length>0">
            <ul class="players">
                <li v-for="option in articleOptions()" :key="option">{{option.title}}</li>
            </ul>
            <iframe :src="iframeUrl()" width="100%" height="600" style="border:1px solid black;"></iframe>
        </span>
    </div>
</template>