<script setup lang="ts">
import ToastContainer from './components/ToastContainer.vue';
</script>

<template>
  <router-view v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
  <ToastContainer />
</template>
