<template>
  <div class="w-full flex flex-col text-2xl">
    <input type="file" @change="handleFileUpload" accept=".pdf" class="text-lg" />
    <div v-if="usGrade" class="flex flex-col">
      <span class="text-gray-400 mt-4">
        Changed CG: {{ usGrade }}
      </span>
      <span class="text-gray-400">
        Total Credit Score: {{ totalScore }}
      </span>
      <span class="text-gray-400">
        Total Credits: {{ totalCredits }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted } from 'vue';

type GradeConversion = {
    A: number;
    'A-': number;
    B: number;
    'B-': number;
    C: number;
    'C-': number;
    D: number;
    [key: string]: number;
};


const usGradeConversionScale: GradeConversion = {
  'A': 4,
  'A-': 4,
  'B': 3.5,
  'B-': 3,
  'C': 2.5,
  'C-': 2,
  'D': 2
}

const usGrade = ref<number>(0);
const totalScore = ref<number>(0);
const totalCredits = ref<number>(0);
const temp = ref({})

onMounted(async () => {
  temp.value = await axios.post('https://cg-converter-backend.netlify.app/');
})

async function handleFileUpload(event: any) {
  const file = (event.target as HTMLInputElement).files?.[0];
    
  if (file && file.type === 'application/pdf') {
    try {
      const formData = new FormData();
      formData.append('pdfFile', file)
      
      const response = await axios.post('https://cg-converter-backend.netlify.app/extract-text', formData);
      const pdfText = response.data.trim();
      const lines = pdfText.split('\n');
      const courseCodes: string[] = [];
      const courseGradePoints: number[] = [];
      const courseCreditPoints: string[] = [];
      const courseType: string[] = [];
      const courseCodeRegex = /^.*[A-Z]\d+[T]?$/gm;
      const courseCreditRegex = /^[A,B,C,D,E,W][-]?$/gm;
      let isNotPending = true;
      const repeatedCourses: string[] = [];
      lines.forEach((line: string) => {
        const course = line.match(courseCodeRegex);
        if(line.includes('Pending')) {
          isNotPending = false;
        }
        
        if (isNotPending) {
          if (course) {
            courseCodes.push(course[0].trim());
          } else if(parseFloat(line.trim()) <= 20 && parseFloat(line.trim()) > 0 && Number.isInteger(parseFloat(line.trim())) && courseCodes.length > courseGradePoints.length) {
            courseGradePoints.push(parseInt(line.trim()));
            
            if(parseFloat(line.trim()) === 20 || parseFloat(line.trim()) === 16) {
              courseCreditPoints.push(line.split(' ')[2]);
              courseType.push('NR');
            }
          } else if((line.trim().match(courseCreditRegex) || line.trim() === 'CLR' || line.trim() === 'GD' || line.trim() === 'BD') && courseCodes.length > courseCreditPoints.length) { 
            courseCreditPoints.push(line.trim());
          } else if(line === '  ' || line.trim() === 'R') {
            courseType.push(line === '  ' ? 'NR' : 'R');
            if(line.trim() === 'R') {
              repeatedCourses.push(courseCodes[courseType.length - 1]);
            }
          }
          if (line.trim().includes('BITS  F221')) {
            courseCodes.push('BITS F221');
            courseGradePoints.push(5);
            courseCreditPoints.push(line.trim().split(' ')[7]);            
            courseType.push('NR');
          }
        }
      }); 
      
      calculateUSSystemGrade(courseCreditPoints, courseGradePoints, repeatedCourses, courseCodes)
    
    } catch (error) {
      console.error('Error reading PDF:', error);
    }
  } else {
    console.error('Invalid file type. Please select a PDF file.');
  }
}

function calculateUSSystemGrade(courseCreditPoints: string[], courseGradePoints: number[], repeatedCourses: string[], courseCodes: string[]) {
  let totalCreditCount: number = 0;
  let totalGradeCount = 0;
  courseCreditPoints.forEach((grade: string, index: number) => {
    switch (grade) {
      case 'A':
        totalCreditCount += courseGradePoints[index] * 4;
        totalGradeCount += courseGradePoints[index];
        break;
      case 'A-':
        totalCreditCount += courseGradePoints[index] * 4;
        totalGradeCount += courseGradePoints[index];
        break
      case 'B':
        totalCreditCount += courseGradePoints[index] * 3.5;
        totalGradeCount += courseGradePoints[index];
        break
      case 'B-':
        totalCreditCount += courseGradePoints[index] * 3;
        totalGradeCount += courseGradePoints[index];
        break;
      case 'C':
        totalCreditCount += courseGradePoints[index] * 2.5;
        totalGradeCount += courseGradePoints[index];
        break;
      case 'C-':
        totalCreditCount += courseGradePoints[index] * 2;
        totalGradeCount += courseGradePoints[index];
        break
      case 'D':
        totalCreditCount += courseGradePoints[index] * 2;
        totalGradeCount += courseGradePoints[index];
        break;
      default:
        break;
    }
  });
  repeatedCourses.forEach((course: string) => {
    const indexOfRepeatedCourse = courseCodes.indexOf(course);
    
    totalCreditCount -= (courseGradePoints[indexOfRepeatedCourse] * usGradeConversionScale[courseCreditPoints[indexOfRepeatedCourse]]);
    totalGradeCount -= courseGradePoints[indexOfRepeatedCourse];
  })
  usGrade.value = Math.round((totalCreditCount/totalGradeCount) * 1000) / 1000;

  totalScore.value = totalCreditCount;
  totalCredits.value = totalGradeCount;
}
</script>
