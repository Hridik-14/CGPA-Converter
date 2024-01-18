<script setup lang="ts">
import PDFUpload from '@/components/PDFUpload.vue';
</script>

<template>
  <div class="absolute top-20 left-[33%] text-5xl">
    BITS 2 US GPA Converter
  </div>
  <div class="flex flex-col min-w-[530px] max-w-max mx-auto border border-gray-300 rounded p-4 shadow custom-right-shadow">
    <PDFUpload />
  </div>  
</template>

<style scoped>
.custom-right-shadow {
  box-shadow: 0px 0 6px -1px rgb(255, 255, 255);
}
</style>
