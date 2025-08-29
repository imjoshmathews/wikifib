<script setup>
    import {state, socket} from '@/socket';
    import { ref } from 'vue';
    const isReady = () => {return state.playerSelf.is_ready}
    const doneReading = ref(false);
    const articleOptions = () => {return state.articleOptions};
    const playersArticle = () => {return state.playersArticle};
    const iframeUrl = () => {
        return "https://en.wikipedia.org/?curid="+playersArticle().wiki_id;
    }
    const selectArticle = (article) => {
        console.log("Sending selected article!",article);
        socket.emit("selectedArticle",article);
    }
    const finishReading = () => {
        if(window.confirm("Are you sure you're finished?")){
            state.playerSelf.is_ready = true;
            socket.emit("playerReady");
        }
    }
</script>

<style></style>

<template>
    <ul class="players" v-if="playersArticle().id === undefined">
        <li v-for="option in articleOptions()" :key="option"><a @click="selectArticle(option)">{{option.title}}</a></li>
    </ul>
    <span v-else-if="!state.playerSelf.is_ready">
        <button @click="finishReading">Finish Reading</button>
        <iframe :src="iframeUrl()" width="100%" height="600" style="border:1px solid red;"/>
    </span>
    <span v-else class="aligned-center"> 
        <h1>Thanks! Sit back and relax, the game will continue shortly.<br>Your article is:<br>{{playersArticle().title}}</h1>
    </span>
</template>