<script setup lang="ts">
import ImageWindow from './components/ImageWindow.vue'
import LayersPanel from './components/LayersPanel.vue'
</script>

<template>
  <div class="flex bg-gray-900 h-screen w-screen">
    <main class="flex flex-col grow overflow-auto min-h-0 min-w-0">
      <ImageWindow />
    </main>
    <aside>
      <LayersPanel />
    </aside>
  </div>
</template>
