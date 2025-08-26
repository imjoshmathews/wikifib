<script setup>
    import { state } from "@/socket"
    
</script>
<style>
    .cgp{
        background-color: red;
    }
</style>
<template>
    <div class="cgp">
    <h2 class="subHeader">CREATE A GAME</h2><br>
    <form @submit.prevent="createGame">
        <label for="maxScore">Max Score </label>
        <input type="number" id="maxScore" name="maxScore" min="5" max="100" v-model="maxScore"><br>
        
        <label for="maxRounds">Max Rounds </label>
        <input type="number" id="maxRounds" name="maxRounds" min="1" max="20" v-model="maxRounds"><br>
        
        <label for="maxArticles">Number of Articles to Choose From </label>
        <input type="number" id="maxArticles" name="maxArticles" min="1" max="5" v-model="maxArticles"><br>
        <button type="submit">Create Game</button>
  </form>
</div>
</template>