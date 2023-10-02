let id = 0

export const uid = () => {
  id++
  return new Date().getTime() + id
}
