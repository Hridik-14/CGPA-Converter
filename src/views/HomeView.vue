<script setup lang="ts">
import PDFUpload from '@/components/PDFUpload.vue';
</script>

<template>
  <div class="absolute md:top-20 top-5 left-1/2 -translate-x-1/2 md:text-4xl text-base">
    BITS 2 US GPA Converter
  </div>
  <div class="flex flex-col md:min-w-[530px] max-w-max mx-auto border border-gray-300 rounded md:p-4 px-4 py-2 shadow custom-right-shadow mt-10 md:mt-0">
    <PDFUpload />
  </div>  
</template>

<style scoped>
.custom-right-shadow {
  box-shadow: 0px 0 6px -1px rgb(255, 255, 255);
}
</style>
