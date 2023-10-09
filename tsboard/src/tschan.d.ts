import { Object } from 'fabric'

export interface Layer {
  id: number
  type: string
  order: number
  name: string
  textbox?: TextBox
  object?: Object
}

export interface TextBox {
  index: number
  name: string
  text: string
  translatedText?: string
  x1: number
  y1: number
  x2: number
  y2: number
  direction: 'vertical' | 'horizontal'
}
