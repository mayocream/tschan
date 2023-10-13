/**
 * Storage Strategy
 * 1. Local IndexedDB (store current state, clear on file close)
 * 2. File System (store only when file is saved)
 * 3. Cloud Storage (store only when file is saved)
 *   - Only when user is logged in
 *
 * So do we still need Tauri' file API?
 */

import { get, set } from 'idb-keyval'

// data should be serialized before compressing
// this saves a lot of space, since local storage is limited to 5MB :(
async function compressJSON(data: string, type = 'application/json'): Promise<string> {
  const encoder = new TextEncoder()
  const compressedStream = new CompressionStream('gzip')
  const stream = new Blob([encoder.encode(data)], { type }).stream().pipeThrough(compressedStream)
  const compressedResponse = new Response(stream)
  const blob = await compressedResponse.blob()
  const arrayBuffer = await blob.arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
}

async function decompressJSON(compressedData: string, type = 'application/octet-stream'): Promise<string> {
  const bytes = Uint8Array.from(atob(compressedData), (c) => c.charCodeAt(0))
  const decompressedStream = new DecompressionStream('gzip')
  const stream = new Blob([bytes], { type }).stream().pipeThrough(decompressedStream)
  const decompressedBlob = await new Response(stream).blob()
  const decoder = new TextDecoder()
  return decoder.decode(await decompressedBlob.arrayBuffer())
}

// TODO: support single file

export async function openLocalFolder() {
  const dirHandle = await showDirectoryPicker({ mode: 'readwrite' })
  const files = await getFilesFromDirHandle(dirHandle)
  console.log('open folder', files)

  await set('dir_handle', dirHandle)

  return dirHandle
}

export async function getFilesFromDirHandle(dirHandle: FileSystemDirectoryHandle): Promise<File[]> {
  const promises = []
  for await (const entry of dirHandle.values()) {
    if (entry.kind != 'file' || !entry.name.match(/\.[jpg|jpeg|png|webp|ts]/)) {
      continue
    }
    promises.push(entry.getFile())
  }
  const files = await Promise.all(promises)
  files.sort((a, b) => a.name.localeCompare(b.name))

  await set('files', files)

  return files
}

// why files handles can be serialized but dir handle can't?
export async function getImageList() {
  return await get<File[]>('files').then((files) => files?.filter((file) => file.type.match(/^image\//)))
}

export async function setCurrentImage(file: File) {
  await set('current_image', file)
}

export async function getCurrentImage() {
  return await get<File>('current_image')
}

// TODO: support cloud storage

export async function readFileAsBlob(file: File): Promise<Blob> {
  let blob = await get(`blob:${file.name}`)
  if (blob) {
    return blob
  }

  blob = new Blob([await file.arrayBuffer()], { type: file.type })
  await set(`blob:${file.name}`, blob)
  return blob
}

// canvas should be serialized before storing
export async function storeCanvasData(name: string, data: string) {
  await set(`canvas:${name}`, data)
}

export async function restoreCanvasData(name: string) {
  return await get<string>(`canvas:${name}`)
}

async function verifyPermission(fileHandle: FileSystemHandle, withWrite = true) {
  const opts: FileSystemHandlePermissionDescriptor = {}
  if (withWrite) {
    opts.mode = 'readwrite'
  }

  // Check if we already have permission, if so, return true.
  if ((await fileHandle.queryPermission(opts)) === 'granted') {
    return true
  }

  // Request permission to the file, if the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === 'granted') {
    return true
  }

  // The user did not grant permission, return false.
  return false
}

export async function writeToFile(filename: string, data: string) {
  const dirHandle = await get<FileSystemDirectoryHandle>('dir_handle')
  if (!dirHandle) return

  if (!(await verifyPermission(dirHandle))) {
    console.error('Permission denied')
    return
  }

  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(data)
  await writable.close()

  console.log('write to file', filename)
}

// testing
(<any>window).writeToFile = writeToFile
