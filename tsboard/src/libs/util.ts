export function debounce(callback: Function, delay: number = 100) {
  let timer: number
  return function () {
    clearTimeout(timer)
    timer = setTimeout(callback, delay)
  }
}
