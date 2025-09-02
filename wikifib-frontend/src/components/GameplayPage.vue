<script setup>
    import {state, socket} from '@/socket';

    const playerSelf = () => {return state.playerSelf};
    const activeArticle = () => {return state.activeArticle};
    const roundEndWindow = () => {return state.roundEndWindow};
    const interrogatorPlayerList = () => {return (state.playerList.filter(player => player.id!==state.playerSelf.id))};
    const guessPlayer = (player) => {
        if(window.confirm(`Are you sure you want to guess ${player.screenname}?`)){
            socket.emit("guessPlayer", player);
        }
    }
    const roundEnd = () => {
        state.roundEndWindow = false;
    }
</script>
<style>
</style>
<template>
    <div v-if="roundEndWindow()">
        Na na na boo boo <button @click="roundEnd">END ROUND</button>
    </div>
    <span>
        THE CURRENT ARTICLE IS<br>
        <h1>{{activeArticle().title}}</h1>
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