import { ref } from 'vue'

export interface PromiseWithTime<T> extends Promise<T> {
  startTime: number
}

export const currentRequest = ref<PromiseWithTime<Response> | null>(null)

export async function fetchWithTimeout(url: string, options: RequestInit | undefined, timeout = 20000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const request: PromiseWithTime<Response> = fetch(url, {
    ...options,
    signal: controller.signal,
  }) as PromiseWithTime<Response>
  request.startTime = Date.now()
  currentRequest.value = request
  return request.finally(() => {
    clearTimeout(id)
    currentRequest.value = null
  })
}
