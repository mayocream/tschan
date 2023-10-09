/**
 * Resize image with aspect ratio
 * Retina display support
 */
export default async function resizeImage(image: Blob, maxWidth: number, maxHeight: number): Promise<Blob> {
  const imageBitmap = await createImageBitmap(image)

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

  // Draw and resize
  ctx!.drawImage(imageBitmap, 0, 0, width, height)

  // Convert canvas to blob
  const resizedBlob = await offscreenCanvas.convertToBlob()

  // the `ctx` and `offscreenCanvas` will be garbage collected

  return resizedBlob
}

/**
  * Resize image without aspect ratio
 */
export async function resizeImageData(image: Blob, width: number, height: number): Promise<ImageData> {
  const imageBitmap = await createImageBitmap(image)

  // Create offscreen canvas
  const offscreenCanvas = new OffscreenCanvas(width, height)
  const ctx = offscreenCanvas.getContext('2d')

  // Draw and resize
  ctx!.drawImage(imageBitmap, 0, 0, width, height)

  // Convert canvas to blob
  const data = ctx!.getImageData(0, 0, width, height)

  return data
}

export async function resizeImageBlob(image: Blob, width: number, height: number): Promise<Blob> {
  const imageBitmap = await createImageBitmap(image)

  // Create offscreen canvas
  const offscreenCanvas = new OffscreenCanvas(width, height)
  const ctx = offscreenCanvas.getContext('2d')

  // Draw and resize
  ctx!.drawImage(imageBitmap, 0, 0, width, height)

  return await offscreenCanvas.convertToBlob()
}
