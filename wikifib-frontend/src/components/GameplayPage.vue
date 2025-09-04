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
    .guess-button{
        text-align: center;
        text-transform: uppercase;
    }
    .article-title{
        font-weight: bold;
        font-style: italic;
    }
</style>
<template>
    <div v-if="roundEndWindow()">
        Na na na boo boo <button @click="roundEnd">END ROUND</button>
    </div>
    <span>
        <h3>THE CURRENT ARTICLE IS</h3>
        <h1 class="article-title">{{activeArticle().title}}</h1>
    </span><br>
    <span v-if="playerSelf().is_honest">
        This is your article.<br>
        Be honest when questioned!
    </span>
    <span v-else-if="playerSelf().is_interrogator">
        You are the interrogator.<br>
        Ask the other players questions until you're ready to guess!<br><br>
        <h3>GUESS THE HONEST PLAYER:</h3><br>
        <button class="guess-button" @click="guessPlayer(player)" v-for="player in interrogatorPlayerList()" :key="player">{{player.screenname}}</button>
    </span>
    <span v-else>
        You are a liar.<br>
        Try to lie convincingly when questioned!
    </span>
</template>