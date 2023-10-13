<script setup lang="ts">
import events from '../events'
import { getImageList, openLocalFolder } from '../libs/storage'
import { useImages } from '../state'

const imagesState = useImages()

// open new project from local folder
// TODO: restore state from local `.ts` files
const openProject = async () => {
  const dirHandle = await openLocalFolder()

  imagesState.images.list = (await getImageList()) || []
  imagesState.images.current = imagesState.images.list[0]
  imagesState.images.dirHandle = dirHandle

  events.emit('project:open')
}
</script>

<template>
  <div class="flex bg-base-300 h-screen w-screen text-neutral-focus">
    <div class="flex flex-col justify-center m-auto w-[300px]">
      <div class="madoka-runes text-[5rem] text-center">tschan</div>
      <button class="btn" @click="openProject">Open Project</button>
      <div class="divider"></div>
      <button class="btn btn-outline btn-disabled cursor-not-allowed">Login to Kumo</button>
    </div>
  </div>
</template>
