<script>
    import { state } from "@/socket"
    export default {
    data() {
      return {
        connname: "ConnectionState",
        computed: {
            connected() {
                return state.connected
            }
        },
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
      },
      connect() {
        socket.connect();
      },
      disconnect(){
        socket.disconnect();
      }
    }
  }
</script>

<template>
  <h1>wf</h1>
  <p v-if="status === 'active'">User is Active</p>
  <p v-else-if="status === 'pending'">User is pending</p>
  <p v-else>User is brrrroken</p>
  <h3>Players:</h3>
    <ul>
      <li v-for="player in players" :key="player">{{ player }}</li>
    </ul>
  <a :href="link">Click for more info</a>
  
  <button @click="toggleStatus">Change status</button>
  <button @click="connect()">Connect</button>"
  <button @click="disconnect()">Disconnect</button>
  <p>State: {{ connected }}</p>

</template>