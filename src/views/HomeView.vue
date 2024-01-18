<script setup lang="ts">
import PDFUpload from '@/components/PDFUpload.vue';
</script>

<template>
  <div class="absolute md:top-20 top-5 md:left-[33%] left-1/4 md:text-5xl text-xl">
    BITS 2 US GPA Converter
  </div>
  <div class="flex flex-col md:min-w-[530px] max-w-max mx-auto border border-gray-300 rounded p-4 shadow custom-right-shadow md:mt-0 mt-10">
    <PDFUpload />
  </div>  
</template>

<style scoped>
.custom-right-shadow {
  box-shadow: 0px 0 6px -1px rgb(255, 255, 255);
}
</style>
