<script setup>
    import {state} from '@/socket';

    const playerSelf = () => {return state.playerSelf};
    const activeArticle = () => {return state.activeArticle};
    const interrogatorPlayerList = () => {return (state.playerList.filter(player => player.id!==state.playerSelf.id))};
    const guessPlayer = (player) => {alert(`are you sure you want to guess ${player.screenname}?`)};

</script>
<style>
</style>
<template>
    <span>
        THE CURRENT ARTICLE IS {{activeArticle().title}}
    </span><br>
    <span>YOU ARE {{playerSelf().screenname}}, YOU HAVE {{playerSelf().score}} POINTS AND</span>
    <span v-if="playerSelf().is_host">
        YOU ARE HOST
    </span>
    <span v-else>
        YOU ARE NOT HOST
    </span><br>
    <span v-if="playerSelf().is_honest">
        THIS IS YOUR ARTICLE! BE HONEST!
    </span>
    <span v-else-if="playerSelf().is_interrogator">
        YOU ARE THE INTERROGATOR! ASK SOME HARD QUESTIONS!
        <br>
        <button @click="guessPlayer(player)" v-for="player in interrogatorPlayerList()" :key="player">guess {{player.screenname}}</button>
    </span>
    <span v-else>
        YOU ARE A LIAR! LIE, DUDE!
    </span>
</template>