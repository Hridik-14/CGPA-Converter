<template>
  <div class="w-full flex flex-col md:text-2xl text-sm relative min-h-16 rounded">
    <div class="w-full my-auto flex items-center relative">
      <input class="opacity-0 absolute" type="file" id="file" @change="handleFileUpload" />
      <label
        class="flex md:text-lg md:p-0 px-2 text-xs justify-center items-center w-full h-12 bg-gray-200 text-gray-700 font-semibold transition duration-300 ease-in-out transform hover:-translate-y-1 rounded cursor-pointer mt-1"
        for="file"
      >
        Upload Performance Sheet
      </label>
    </div>
    <div v-if="loading" class="mt-4 flex flex-row items-center">
      <span class="mr-7 text-gray-400">Calculating GPA</span>
      <div class="snippet" data-title="dot-pulse">
        <div class="stage">
          <div class="dot-pulse"></div>
        </div>
      </div>
    </div>
    <div v-else-if="usGrade" class="flex flex-col">
      <div class="flex justify-between mt-4">
        <span class="text-gray-400"> GPA in US Grade Points (out of 4): </span>
        <span>{{ usGrade }}</span>
      </div>
      <div class="flex justify-between mt-4">
        <span class="text-gray-400"> Total Credit Score: </span>
        <span>{{ totalScore }}</span>
      </div>
      <div class="flex justify-between mt-4">
        <span class="text-gray-400"> Total Credits: </span>
        <span>{{ totalCredits }}</span>
      </div>
    </div>
    <div v-else-if="error" class="mt-4">
      Not able to read the pdf <br />
      Please check the file uploaded
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import autoTable, { type RowInput, Row } from 'jspdf-autotable'

type GradeConversion = {
  A: number
  'A-': number
  B: number
  'B-': number
  C: number
  'C-': number
  D: number
  E: number
  [key: string]: number
}

const usGradeConversionScale: GradeConversion = {
  A: 4,
  'A-': 4,
  B: 3.5,
  'B-': 3,
  C: 2.5,
  'C-': 2,
  D: 2,
  E: 0
}

const usGrade = ref<number>(0)
const totalScore = ref<number>(0)
const totalCredits = ref<number>(0)
const error = ref(false)
const loading = ref(false)
const pdfBody: RowInput[] = []

async function handleFileUpload(event: any) {
  const file = (event.target as HTMLInputElement).files?.[0]

  pdfBody.splice(0, pdfBody.length)

  loading.value = true

  if (file && file.type === 'application/pdf') {
    try {
      const formData = new FormData()
      formData.append('pdfFile', file)

      const response = await axios.post(
        'https://cg-converter-backend.netlify.app/.netlify/functions/api/extract-text',
        formData
      )
      const pdfText = response.data.trim()
      if (!pdfText.trim()) {
        error.value = true
      }

      const lines = pdfText.split('\n')
      const courseCodes: string[] = []
      const courseGradePoints: number[] = []
      const courseCreditPoints: string[] = []
      const courseType: string[] = []
      const courseCodeRegex = /^.*\s\s[A-Z]\d+[T]?$/gm
      const courseCreditRegex = /^[A,B,C,D,E,W][-]?$/gm
      let isNotPending = true
      const repeatedCourses: string[] = []
      lines.forEach((line: string) => {
        const course = line.match(courseCodeRegex)
        if (line.includes('Pending')) {
          isNotPending = false
        }

        if (isNotPending) {
          if (line.trim().includes('BITS  F221')) {
            courseCodes.push('BITS F221')
            courseGradePoints.push(5)
            courseCreditPoints.push(line.trim().split(' ')[7])
            courseType.push('NR')
          }
          if (course) {
            if (course[0].includes('BITS  F221')) {
              courseCodes.push(course[0].split('BITS  F221 PRACTICE SCHOOL I 5 A')[1].trim())
            } else {
              courseCodes.push(course[0].trim())
            }
          } else if (
            parseFloat(line.trim()) <= 20 &&
            parseFloat(line.trim()) > 0 &&
            Number.isInteger(parseFloat(line.trim())) &&
            courseCodes.length > courseGradePoints.length
          ) {
            courseGradePoints.push(parseInt(line.trim()))

            if (parseFloat(line.trim()) === 20 || parseFloat(line.trim()) === 16) {
              courseCreditPoints.push(line.split(' ')[2])
              courseType.push('NR')
            }
          } else if (
            (line.trim().match(courseCreditRegex) ||
              line.trim() === 'CLR' ||
              line.trim() === 'GD' ||
              line.trim() === 'BD') &&
            courseCodes.length > courseCreditPoints.length
          ) {
            courseCreditPoints.push(line.trim())
          } else if (line === '  ' || line.trim() === 'R') {
            courseType.push(line === '  ' ? 'NR' : 'R')
            if (line.trim() === 'R') {
              repeatedCourses.push(courseCodes[courseType.length - 1])
            }
          }
        }
      })

      if (courseCodes.length > 0) {
        calculateUSSystemGrade(courseCreditPoints, courseGradePoints, repeatedCourses, courseCodes)
      } else {
        error.value = true
      }
    } catch (error) {
      console.error('Error reading PDF:', error)
    }
  } else {
    console.error('Invalid file type. Please select a PDF file.')
  }

  loading.value = false
}

function calculateUSSystemGrade(
  courseCreditPoints: string[],
  courseGradePoints: number[],
  repeatedCourses: string[],
  courseCodes: string[]
) {
  let totalCreditCount: number = 0
  let totalGradeCount = 0
  courseCreditPoints.forEach((grade: string, index: number) => {
    const courseDetails = []
    switch (grade) {
      case 'A':
        totalCreditCount += courseGradePoints[index] * 4
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('4')
        pdfBody.push(courseDetails)
        break
      case 'A-':
        totalCreditCount += courseGradePoints[index] * 4
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('4')
        pdfBody.push(courseDetails)
        break
      case 'B':
        totalCreditCount += courseGradePoints[index] * 3.5
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('3.5')
        pdfBody.push(courseDetails)
        break
      case 'B-':
        totalCreditCount += courseGradePoints[index] * 3
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('3')
        pdfBody.push(courseDetails)
        break
      case 'C':
        totalCreditCount += courseGradePoints[index] * 2.5
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('2.5')
        pdfBody.push(courseDetails)
        break
      case 'C-':
        totalCreditCount += courseGradePoints[index] * 2
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('2')
        pdfBody.push(courseDetails)
        break
      case 'D':
        totalCreditCount += courseGradePoints[index] * 2
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('2')
        pdfBody.push(courseDetails)
        break
      case 'E':
        totalCreditCount += courseGradePoints[index] * 2
        totalGradeCount += courseGradePoints[index]
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('2')
        pdfBody.push(courseDetails)
        break
      case 'CLR':
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('PASS')
        pdfBody.push(courseDetails)
        break
      case 'GD':
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('PASS')
        pdfBody.push(courseDetails)
        break
      case 'BD':
        courseDetails.push(courseCodes[index])
        courseDetails.push(courseGradePoints[index].toString())
        courseDetails.push(grade)
        courseDetails.push('FAIL')
        pdfBody.push(courseDetails)
        break
      default:
        break
    }
  })
  repeatedCourses.forEach((course: string) => {
    const indexOfRepeatedCourse = courseCodes.indexOf(course)

    totalCreditCount -=
      courseGradePoints[indexOfRepeatedCourse] *
      usGradeConversionScale[courseCreditPoints[indexOfRepeatedCourse]]
    totalGradeCount -= courseGradePoints[indexOfRepeatedCourse]
  })
  usGrade.value = Math.round((totalCreditCount / totalGradeCount) * 100) / 100

  totalScore.value = totalCreditCount
  totalCredits.value = totalGradeCount
}
</script>

<style scoped>
.dot-pulse {
  position: relative;
  left: -9999px;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: rgb(156 163 175);
  color: rgb(156 163 175);
  box-shadow: 9999px 0 0 -5px;
  animation: dot-pulse 1.5s infinite linear;
  animation-delay: 0.25s;
}
.dot-pulse::before,
.dot-pulse::after {
  content: '';
  display: inline-block;
  position: absolute;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: rgb(156 163 175);
  color: rgb(156 163 175);
}
.dot-pulse::before {
  box-shadow: 9984px 0 0 -5px;
  animation: dot-pulse-before 1.5s infinite linear;
  animation-delay: 0s;
}
.dot-pulse::after {
  box-shadow: 10014px 0 0 -5px;
  animation: dot-pulse-after 1.5s infinite linear;
  animation-delay: 0.5s;
}

@keyframes dot-pulse-before {
  0% {
    box-shadow: 9984px 0 0 -5px;
  }
  30% {
    box-shadow: 9984px 0 0 2px;
  }
  60%,
  100% {
    box-shadow: 9984px 0 0 -5px;
  }
}
@keyframes dot-pulse {
  0% {
    box-shadow: 9999px 0 0 -5px;
  }
  30% {
    box-shadow: 9999px 0 0 2px;
  }
  60%,
  100% {
    box-shadow: 9999px 0 0 -5px;
  }
}
@keyframes dot-pulse-after {
  0% {
    box-shadow: 10014px 0 0 -5px;
  }
  30% {
    box-shadow: 10014px 0 0 2px;
  }
  60%,
  100% {
    box-shadow: 10014px 0 0 -5px;
  }
}
</style>
