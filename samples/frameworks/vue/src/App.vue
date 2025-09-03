<template>
  <div>
    <div class="dds-title">
      <h2>Hello World for Vue</h2>
      <img src="./assets/vue.svg" class="vue-logo" alt="logo" />
    </div>
    <div id="results"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { DocumentScanner } from 'dynamsoft-document-scanner'

onMounted(async () => {
  try {
    const scanner = new DocumentScanner({
      license: 'YOUR_LICENSE_KEY_HERE',
    })

    const result = await scanner.launch()
    if (result?.correctedImageResult) {
      const resultsDiv = document.getElementById('results')
      if (resultsDiv) {
        resultsDiv.innerHTML = ''
        resultsDiv.appendChild(result.correctedImageResult.toCanvas())
      }
    }
  } catch (error) {
    console.error('Error initializing document scanner:', error)
  }
})
</script>

<style scoped>
.dds-title {
  text-align: center;
  margin: 20px 0;
}

.dds-title h2 {
  display: inline;
  margin-right: 10px;
}

.vue-logo {
  width: 45px;
  height: 45px;
  vertical-align: middle;
}

:deep(#results canvas) {
  max-width: 100%;
  height: auto;
}
</style>
