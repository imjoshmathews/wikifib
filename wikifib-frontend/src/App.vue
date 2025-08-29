<script setup>
  import { socket, state, PageModes } from './socket';
  import RoomCodeLobby from '@/components/RoomCodeLobby.vue';
  import LandingPage from '@/components/LandingPage.vue';
  import ArticlePortal from '@/components/ArticlePortal.vue';
  import HowToPlay from './components/HowToPlay.vue';
  import GameplayPage from './components/GameplayPage.vue';
  import PlayerInfo from './components/PlayerInfo.vue';
  const frontendMode = () => {return state.frontendMode};
  const tutorialWindow = () => {return state.tutorialWindow};
  const toggleTutorialWindow = () => {state.tutorialWindow = !state.tutorialWindow};
  const inRoom = () => {return (state.roomCode !== 'undefined')};
</script>

<style>
  .main-header {
    /* color: white; */
    text-align: center;
  }
  .subtitle {
    text-align: center;
    font-size: 1.5rem;
    padding: 0;
  }
  .center-aligned {
    text-align: center;
  }
  button {
    padding: 1rem;
    border: none;
    border-radius: 0.5rem;
    text-align: center;
  }
  footer {
    position: absolute;
    bottom: 6px;
    right: 12px;
    font-size: x-small;
    text-align: right;
  }
  input {
    /* color: white; */
    /* background-color: #232323; */
    text-align: center;
    border-radius: 0.5rem;
  }
  .how-to-button {
    width: 0.5rem;
    height: 0.5rem;
    padding: 5%;
    border-radius:100%
  }
  .right-aligned{
    text-align: right;
    text-transform: uppercase;
  }
</style>

<template>
  <button class="how-to-button" @click="toggleTutorialWindow()">?</button>
  <div class="right-aligned">
  <PlayerInfo v-if="inRoom()"/>
  </div>
  <HowToPlay v-if="tutorialWindow()"/>
  <h1 class="main-header">wikifib</h1>
  <h2 class="subtitle">A party game about learning and lying.</h2>
  <br>
  <LandingPage v-if="frontendMode()===PageModes.OnLandingPage"/>
  <RoomCodeLobby v-if="frontendMode()===PageModes.InLobby"/>
  <ArticlePortal v-if="frontendMode()===PageModes.ChoosingArticle"/>
  <GameplayPage v-if="frontendMode()===PageModes.PlayingGame"/>
</template>