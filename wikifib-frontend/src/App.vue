<script setup>
  import { socket, state, PageModes } from './socket';
  import RoomCodeLobby from '@/components/RoomCodeLobby.vue';
  import LandingPage from '@/components/LandingPage.vue';
  import ArticlePortal from '@/components/ArticlePortal.vue';
  const frontendMode = () => {return state.frontendMode}
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
</style>

<template>
  <h1 class="main-header">wikifib</h1>
  <h2 class="subtitle">A party game about learning and lying.</h2>
  <br>
  <LandingPage v-if="frontendMode()===PageModes.OnLandingPage"/>
  <RoomCodeLobby v-if="frontendMode()===PageModes.InLobby"/>
  <ArticlePortal v-if="frontendMode()===PageModes.ChoosingArticle"/>
</template>