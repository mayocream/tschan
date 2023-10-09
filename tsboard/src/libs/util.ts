export function debounce(callback: Function, delay: number) {
  let timer: number
  return function () {
    clearTimeout(timer)
    timer = setTimeout(callback, delay)
  }
}
