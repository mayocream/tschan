import { Object } from 'fabric'

export interface Layer {
  id: number
  type: string
  index: number // starts from 0
  name: string
  textbox?: TextBox
  object?: Object
}

export interface TextBox {
  order: number // starts from 1
  text?: string // raw text from OCR
  translatedText?: string
  x1: number
  y1: number
  x2: number
  y2: number
  direction: 'vertical' | 'horizontal'
}
