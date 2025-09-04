<script setup>
    import {state, socket} from '@/socket';
    const isReady = () => {return state.playerSelf.is_ready}
    const articleOptions = () => {return state.articleOptions};
    const playersArticle = () => {return state.playersArticle};
    const iframeUrl = () => {
        return "https://en.m.wikipedia.org/?curid="+playersArticle().wiki_id;
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

<style>
    .wikiportal{
        width: 100%;
        height: 600px;
    }
    .finish-reading{
        width: 100%;
    }
    .waiting{
        text-align: center;
        position: absolute;
        top: 33%;
    }
</style>

<template>
    <ul class="players" v-if="playersArticle().id === undefined">
        <li v-for="option in articleOptions()" :key="option"><a @click="selectArticle(option)">{{option.title}}</a></li>
    </ul>
    <span v-else-if="!state.playerSelf.is_ready">
        <iframe :src="iframeUrl()" class="wikiportal"/>
        <button @click="finishReading" class="finish-reading">Finish Reading</button>
    </span>
    <span v-else class="aligned-center waiting"> 
        <h2>Sit back and relax, the game will continue shortly.<br>Your article is:</h2><h1><br>{{playersArticle().title}}</h1>
    </span>
</template>