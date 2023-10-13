import { shallowRef } from 'vue'

export interface PromiseWithTime<T> extends Promise<T> {
  startTime: number
}

export const requestQueue = shallowRef<PromiseWithTime<Response>[]>([])

export async function fetchWithTimeout(url: string, options?: RequestInit | undefined, timeout = 10000) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  const request: PromiseWithTime<Response> = fetch(url, {
    ...options,
    signal: controller.signal,
  }) as PromiseWithTime<Response>
  request.startTime = Date.now()
  requestQueue.value.push(request)
  return request.finally(() => {
    requestQueue.value = requestQueue.value.filter((r) => r !== request)
  })
}
