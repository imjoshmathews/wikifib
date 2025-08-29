<script setup>
    import {state, clearSession} from '@/socket';
    const closePopup = () => { state.tutorialWindow = false }
</script>
<style>
    .popup{
        outline-style:dashed;
        outline-width:2px;
        outline-color:rgb(225, 0, 255);
        background-color: rgb(17, 1, 4);
        padding: 0.5rem;
        z-index: 2;
        position: fixed;
    }
</style>
<template>
    <div class="popup">
        <p>fill this in later with an explanation of how the game works.</p>
        <button @click="clearSession()">clear cache</button>
        <button @click="closePopup()">close tutorial</button>
    </div>
    
</template>