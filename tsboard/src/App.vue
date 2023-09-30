<script setup lang="ts">
import ImageWindow from './components/ImageWindow.vue'
import LayersPanel from './components/LayersPanel.vue'
import ThumbnailsPanel from './components/ThumbnailsPanel.vue';
</script>

<template>
  <div class="flex bg-gray-900 h-screen w-screen">
    <ThumbnailsPanel />
    <!-- https://stackoverflow.com/questions/63601481/flex-child-is-overflowing-the-parent-container-even-after-setting-min-width0 -->
    <main class="flex flex-col grow min-h-0 min-w-0">
      <ImageWindow />
    </main>
    <aside>
      <LayersPanel />
    </aside>
  </div>
</template>
