<script setup>
    import {state, clearSession} from '@/socket';
    const closePopup = () => {

        state.tutorialWindow = false;
    }
</script>
<style>
    .popup{
        /* outline-style:dashed;
        outline-width:2px; */
        outline-color:rgb(225, 0, 255);
        color: rgb(235,235,235,0.66);
        background-color: #222222;
        padding: 0.5rem;
        z-index: 2;
        position: absolute;
        top: 32px;
        left: 32px;
        max-width: 80%;
    }
    .glow-interrogator{
        color: #DDDDFF; 
        text-align: center;
        -webkit-animation: glow-blue 1s ease-in-out infinite alternate;
        -moz-animation: glow-blue 1s ease-in-out infinite alternate;
        animation: glow-blue 1s ease-in-out infinite alternate;
    }
    .glow-honest{
        color: #DDFFDD;
        text-align: center;
        -webkit-animation: glow-green 1s ease-in-out infinite alternate;
        -moz-animation: glow-green 1s ease-in-out infinite alternate;
        animation: glow-green 1s ease-in-out infinite alternate;
    }
    .glow-liar{
        color: #FFDDDD;
        text-align: center;
        -webkit-animation: glow-red 1s ease-in-out infinite alternate;
        -moz-animation: glow-red 1s ease-in-out infinite alternate;
        animation: glow-red 1s ease-in-out infinite alternate;
    }
    .scale-up-tl {
        -webkit-animation: scale-up-tl 0.5s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
        animation: scale-up-tl 0.5s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
    }
    .clear-button {
        background-color:#404040;
        color: white;
    }
    .clear-button:hover{
        -webkit-animation: c-shift 0.5s alternate infinite;
    }
    @-webkit-keyframes c-shift {
        to { background-color: #808080 }
    }
    @-webkit-keyframes scale-up-tl {
    0% {
        -webkit-transform: scale(0.5);
                transform: scale(0.5);
        -webkit-transform-origin: 0% 0%;
                transform-origin: 0% 0%;
    }
    100% {
        -webkit-transform: scale(1);
                transform: scale(1);
        -webkit-transform-origin: 0% 0%;
                transform-origin: 0% 0%;
    }
    }
    @keyframes scale-up-tl {
    0% {
        -webkit-transform: scale(0);
                transform: scale(0);
        -webkit-transform-origin: 0% 0%;
                transform-origin: 0% 0%;
    }
    100% {
        -webkit-transform: scale(1);
                transform: scale(1);
        -webkit-transform-origin: 0% 0%;
                transform-origin: 0% 0%;
    }
    }
    @-webkit-keyframes glow-red {
        from {
            text-shadow: 0 0 05px #e61b00, 0 0 10px #e61b00, 0 0 15px #e61b00, 0 0 20px #e61b00, 0 0 25px #e61b00;
        }
        to {
            text-shadow:  0 0 10px #ff4d4d, 0 0 15px #ff4d4d, 0 0 20px #ff4d4d, 0 0 25px #ff4d4d, 0 0 30px #ff4d4d;
        }
    }
    @-webkit-keyframes glow-green {
        from {
            text-shadow: 0 0 05px #00e658, 0 0 10px #00e658, 0 0 15px #00e658, 0 0 20px #00e658, 0 0 25px #00e658;
        }
        to {
            text-shadow:  0 0 10px #4dff88, 0 0 15px #4dff88, 0 0 20px #4dff88, 0 0 25px #4dff88, 0 0 30px #4dff88;
        }
    }
    @-webkit-keyframes glow-blue {
        from {
            text-shadow: 0 0 05px #003688, 0 0 10px #003688, 0 0 15px #003688, 0 0 20px #003688, 0 0 25px #003688;
        }
        to {
            text-shadow:  0 0 10px #2e74cf, 0 0 15px #2e74cf, 0 0 20px #2e74cf, 0 0 25px #2e74cf, 0 0 30px #2e74cf;
        }
    }
</style>
<template>
    <div class="popup scale-up-tl">
        <p><span style="font-weight:bold">Wikifib</span> is a social party game for 3+ players.
        <br>Although it can be played remotely using voice chat, it's best suited for play in-person.
        <br><br>Play begins with each player choosing one of several randomly generated Wikipedia article titles. Players will skim their article, trying to commit as much as they can to memory as quickly as possible. Once everyone has marked that they're finished reading, one player is randomly selected as the <span class="glow-interrogator">interrogator</span>. Then, one of the articles from the remaining players will be chosen at random as the topic for the round. The player who actually read the randomly selected article is the round's <span class="glow-honest">honest player</span>. Each other player in the game is a <span class="glow-liar">liar</span> for the round.
        <br><br>The <span class="glow-interrogator">interrogator's</span> job is to determine who actually read the article. To accomplish this, they may ask any questions they want about the article to the other players in the game. They call the shots in a round, and no player may speak without the interrogator's permission. They earn points only if they select the honest player.
        <br><br>The <span class="glow-honest">honest player's</span> job is to convincingly tell the truth, to the best of their ability. After all, they read the article. They may only respond to direct questions from the interrogator. They gain points if the interrogator selects them.
        <br><br>A <span class="glow-liar">liar's</span> job is to trick the interrogator into believing they were the one who read the article by lying through their teeth when questioned. They also may only respond to direct questions from the interrogator. They earn points if the interrogator selects them.
        <br><br>Between rounds, the previous round's <span class="glow-honest">honest player</span> chooses another article to skim over before play continues. They also take the role of the next round's <span class="glow-interrogator">interrogator</span>. Another article is selected, and so a new player becomes the <span class="glow-honest">honest player</span>.
        <br><br>Play continues until a player reaches the score limit or until the maximum number of rounds has been played, but let's be real - you're not playing this game to keep score.
        <br><br>Inspired by "Two of These People are Lying" by The Technical Difficulties. Check them out <a href="https://www.youtube.com/watch?v=3UAOs9B9UH8">here!</a></p>
        <br>
        <button class="clear-button" @click="clearSession()">Clear Session</button>
        <br><br>
    </div>
    
</template>