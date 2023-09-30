export default async function resizeImage(imageSrc: string, maxWidth: number, maxHeight: number): Promise<Blob> {
  // Fetch image as blob
  const response = await fetch(imageSrc)
  const blob = await response.blob()
  const imageBitmap = await createImageBitmap(blob)

  // Calculate the aspect ratio
  const aspectRatio = imageBitmap.width / imageBitmap.height
  let width, height

  // Set width and height based on aspect ratio
  if (imageBitmap.width > imageBitmap.height) {
    width = maxWidth
    height = maxWidth / aspectRatio
  } else {
    height = maxHeight
    width = maxHeight * aspectRatio
  }

  // Set width and height based on dppx
  const dppx = Math.max(window.devicePixelRatio, 2)
  width = width * dppx
  height = height * dppx

  // Create offscreen canvas
  const offscreenCanvas = new OffscreenCanvas(width, height)
  const ctx = offscreenCanvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get the 2D context from OffscreenCanvas')
  }

  // Draw and resize
  ctx.drawImage(imageBitmap, 0, 0, width, height)

  // Convert canvas to blob
  const resizedBlob = await offscreenCanvas.convertToBlob()

  return resizedBlob
}
