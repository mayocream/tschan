import { cropImage } from './cropImage'
import { resizeImageBlob } from './resizeImage'

// @ts-ignore
const INCUBATOR_URL = window.INCUBATOR_URL ?? `http://localhost:43101`

// try if incubator is running
const incubatorRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${INCUBATOR_URL}`)
    return response.status == 200
  } catch (e) {
    return false
  }
}

export const isIncubatorAvailable = incubatorRunning()

export const inferenceComicTextDetectorPlusMangaOcr = async (image: Blob): Promise<any> => {
  const blob = await resizeImageBlob(image, 1024, 1024)
  const startTime = Date.now()

  // form format removed OPTIONS requests (CORS)
  const form = new FormData()
  form.append('image', blob)

  const response = await fetch(`${INCUBATOR_URL}/magic/comic-text-detector+manga-ocr`, {
    method: 'POST',
    body: form,
  })

  const endTime = Date.now()

  const data = await response.json()
  console.log('inferenceMangaOcr: ', data, `(${endTime - startTime} ms)`)
  return data
}

export const inferenceMangaOcr = async (image: Blob, bbox: number[]): Promise<string> => {
  const blob = await cropImage(image, bbox)
  const startTime = Date.now()

  // form format removed OPTIONS requests (CORS)
  const form = new FormData()
  form.append('image', blob)

  const response = await fetch(`${INCUBATOR_URL}/magic/manga-ocr`, {
    method: 'POST',
    body: form,
  })

  const endTime = Date.now()

  const data = await response.json()
  console.log('inferenceMangaOcr: ', data, `(${endTime - startTime} ms)`)
  return data
}

// extremely slow...
export const inferenceMangaOcrHuggingFace = async (image: Blob, bbox: number[]): Promise<string> => {
  const blob = await cropImage(image, bbox)
  const startTime = Date.now()

  // https://api-inference.huggingface.co/models/kha-white/manga-ocr-base
  const response = await fetch('https://kumo.e.ki/ocr', {
    method: 'POST',
    body: blob,
    headers: {
      'content-type': 'image/png',
    },
  })

  const endTime = Date.now()

  const data = await response.json()
  console.log('inferenceMangaOcr: ', data, `(${endTime - startTime} ms)`)
  return data
}
