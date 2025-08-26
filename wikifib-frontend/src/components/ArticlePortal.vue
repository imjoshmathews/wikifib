<script setup>
    import {state, socket, PageModes} from '@/socket';
    import { ref } from 'vue';
    const articleOptions = () => {return state.articleOptions};
    const playersArticle = () => {return state.playersArticle};
    const iframeUrl = () => {
        let opt = playersArticle();
        let url = "https://en.wikipedia.org/?curid="+playersArticle().wiki_id;
        return url;
    }
    const selectArticle = (article) => {
        console.log("Sending selected article!",article);
        socket.emit("selectedArticle",article);
    }
</script>

<style></style>

<template>
    <ul class="players" v-if="playersArticle().id === undefined">
        <li v-for="option in articleOptions()" :key="option"><a @click="selectArticle(option)">{{option.title}}</a></li>
    </ul>
    <iframe v-else :src="iframeUrl()" width="100%" height="600" style="border:1px solid red;"/>>     
</template>