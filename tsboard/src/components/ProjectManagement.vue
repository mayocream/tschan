<script setup lang="ts">
import events from '../events'
import { getImageList, openLocalFolder } from '../libs/storage'
import { useImages } from '../state'

const imagesState = useImages()

const openProject = async () => {
  await openLocalFolder()

  imagesState.images.list = (await getImageList()) || []
  imagesState.images.current = imagesState.images.list[0]

  events.emit('project:open')
}
</script>

<template>
  <div class="flex bg-gray-800 h-screen w-screen">
    <div class="flex flex-col justify-center m-auto w-[300px]">
      <div class="madoka-runes text-[5rem] text-center">tschan</div>
      <button class="btn" @click="openProject">Open Project</button>
      <div class="divider"></div>
      <button class="btn btn-outline btn-disabled cursor-not-allowed">Login to Kumo</button>
    </div>
  </div>
</template>
