<script setup>
    import {state} from '@/socket';
    const playerSelf = () => {return state.playerSelf};
    const game = () => {return state.game};
</script>
<style>
</style>
<template>
    {{playerSelf().screenname}}<br>
    {{playerSelf().score}}/{{game().max_score}} Points<br>
    Round {{game().current_round}} / {{game().max_rounds}}
    <span v-if="playerSelf().is_host"><br>Host</span>
</template>

