<script setup lang="ts">
import PDFUpload from '@/components/PDFUpload.vue';
</script>

<template>
  <div class="flex flex-col w-3/5 min-w-100 mx-auto border border-gray-300 rounded p-4 shadow custom-right-shadow">
    <PDFUpload />
  </div>  
</template>

<style scoped>
.custom-right-shadow {
  box-shadow: 0px 0 6px -1px rgb(255, 255, 255);
}
</style>
