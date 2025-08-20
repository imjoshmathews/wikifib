<script>
  export default {
    data(){
      return {
        name: 'Josh',
        status: 'silly',
        players: ['Dakota', 'Dustin', 'Hannah'],
        link: 'https://lanefire.net',
      }
    },
    methods: {
      toggleStatus(){
        if(this.status === 'active'){
          this.status = 'pending';
        } else if(this.status === 'pending'){
          this.status = 'wonky';
        } else this.status = 'active';
      }
    }
  }
</script>


<template>
  <h1>wikifib by {{name}}</h1>
  <p v-if="status === 'active'">User is Active</p>
  <p v-else-if="status === 'pending'">User is pending</p>
  <p v-else>User is broken</p>
  <h3>Players:</h3>
    <ul>
      <li v-for="player in players" :key="player">{{ player }}</li>
    </ul>
  <a :href="link">Click for more info</a>
  
  <button @click="toggleStatus">Change status</button>
</template>