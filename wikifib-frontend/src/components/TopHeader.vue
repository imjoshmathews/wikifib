<script setup>
    import { state, PageModes } from '@/socket';
    import PlayerInfo from './PlayerInfo.vue';
    const toggleTutorialWindow = () => {state.tutorialWindow = !state.tutorialWindow};
    const buttonText = () => {return state.tutorialWindow ? 'x' : 'rules'};
    const frontendMode = () => {return state.frontendMode};
    const inRoom = () => {return (state.roomCode !== 'undefined')};
</script>
<style>
    .gridboxes{
        display: grid;
        grid-template-columns: 20% 60% 20%;
        text-align: center;
    }
    .main-header {
        /* color: white; */
        text-align: center;
        top: 0;
    }
    .subtitle {
        text-align: center;
        font-size: 1.5rem;
        padding: 0;
    }
    .how-to-button {
        /* width: 32px;
        height: 32px; */
        font-size: xx-small;
        padding: 12px;
        border-radius: 50%;
        position: absolute;
        left: 8px;
        top: 8px;
        z-index: 3;
        background-color: #404040;
        color: white;
    }
</style>
<template>
    <div class="gridboxes">
        <div>
            <button class="how-to-button" @click="toggleTutorialWindow()">{{buttonText()}}</button>
        </div>
        <div>
            <h1 class="main-header">wikifib</h1>
            <h3 class="subtitle" v-if="frontendMode()===PageModes.OnLandingPage">A party game about learning and lying.</h3>
        </div>
        <div>
            <PlayerInfo v-if="inRoom()"/>
        </div>
    </div>
</template>