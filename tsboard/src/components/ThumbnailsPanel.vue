<script setup lang="ts">
import { onMounted } from 'vue'
import resizeImage from '../libs/resizeImage'
import { useImages } from '../state'
import { readFileAsBlob, setCurrentImage as setCurrentFile } from '../libs/storage'
import events from '../events'

const imagesStore = useImages()

const emptyImage = 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII='

const lazyLoadImages = async () => {
  const images = [].slice.call(document.querySelectorAll('img.lazy'))

  // Dynamic resize thumbnail images to improve performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLImageElement
        const image = imagesStore.images.list.find((image) => image.name == element.dataset.name)!
        const blob = await resizeImage(await readFileAsBlob(image), 96, 128)
        element.src = URL.createObjectURL(blob)
        element.classList.remove('lazy')
        observer.unobserve(element)
      }
    })
  })

  images.forEach((image) => {
    observer.observe(image)
  })
}

const setCurrentImage = async (image: File) => {
  imagesStore.images.current = image
  await setCurrentFile(image)
}

onMounted(async () => {
  lazyLoadImages()
  events.on('project:open', lazyLoadImages)
})
</script>

<template>
  <aside class="min-w-[6rem] w-[13rem] overflow-auto h-full">
    <div class="flex flex-row flex-wrap justify-stretch my-2 gap-y-2 select-none">
      <figure
        v-for="image in imagesStore.images.list"
        @click="setCurrentImage(image)"
        :key="image.name"
        :data-active="image?.name == imagesStore.images.current?.name"
        class="w-24 h-34 m-auto opacity-70 hover:opacity-100 relative box-border data-[active=true]:opacity-100 data-[active=true]:border-2 data-[active=true]:border-blue-500"
      >
        <img draggable="false" :src="emptyImage" :alt="image.name" :data-name="image.name" class="w-24 h-32 object-scale-down lazy" />
        <figcaption class="text-[.8rem] truncate text-center text-sm absolute bottom-0 w-full bg-[rgba(0,0,0,0.7)] text-white">
          {{ image.name }}
        </figcaption>
      </figure>
    </div>
  </aside>
</template>
