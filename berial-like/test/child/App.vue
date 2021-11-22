<template>
  <div>
    <div>Hello {{ name }}!</div>
    <div>current count: {{ count }}</div>
    <button v-on:click="change">add</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      name: 'Vue',
      count: 0,
    }
  },
  methods: {
    change: function () {
      this.count += 1
    },
  },
  beforeUnmount() {
    console.log('beforeUnmount')
  },
}
</script>
