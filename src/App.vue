<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue"
import styles from "./index.module.scss"
</script>

<template>
  <div :class="styles.container">
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped lang="scss">
.bg {
  background-color: $lessBg;
}

.logo {
  will-change: filter;
  padding: 1.5em;
  height: 6em;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
