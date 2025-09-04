<script setup>
  import { socket, state, PageModes } from './socket';
  import TopHeader from './components/TopHeader.vue';
  import RoomCodeLobby from '@/components/RoomCodeLobby.vue';
  import LandingPage from '@/components/LandingPage.vue';
  import ArticlePortal from '@/components/ArticlePortal.vue';
  import HowToPlay from './components/HowToPlay.vue';
  import GameplayPage from './components/GameplayPage.vue';
  import PlayerInfo from './components/PlayerInfo.vue';
  const frontendMode = () => {return state.frontendMode};
  const tutorialWindow = () => {return state.tutorialWindow};
  const inRoom = () => {return (state.roomCode !== 'undefined')};
  const buttonText = () => {return state.tutorialWindow ? 'x' : 'rules'};
</script>

<style>

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
 
  .right-aligned{
    text-align: right;
    text-transform: uppercase;
  }
</style>

<template>
  <TopHeader/>
  <HowToPlay v-if="tutorialWindow()"/>
  <LandingPage v-if="frontendMode()===PageModes.OnLandingPage"/>
  <RoomCodeLobby v-if="frontendMode()===PageModes.InLobby"/>
  <ArticlePortal v-if="frontendMode()===PageModes.ChoosingArticle"/>
  <GameplayPage v-if="frontendMode()===PageModes.PlayingGame"/>
  <footer>Joshua Mathews ©2025 - All Rights Reserved</footer>
</template>