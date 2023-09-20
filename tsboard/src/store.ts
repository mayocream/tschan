import { create } from 'zustand'

const useStore = create((set) => ({
  canvas: undefined,
  setCanvas: (value) => set({ canvas: value }),
}))

export default useStore
