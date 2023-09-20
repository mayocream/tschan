import React, { useEffect, useRef } from 'react'
import SampleImage01 from '../assets/images/sample_01.jpg'
import { fabric } from 'fabric'

function ImageWindow({ imageUrl = SampleImage01 }) {
  const canvasParentRef = useRef<HTMLDivElement>(null)
  const canvasNodeRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<fabric.Canvas>()

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasNodeRef.current, {
      width: canvasParentRef.current?.clientWidth,
      height: window.innerHeight * 2,
    })
    canvasRef.current = canvas
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        img.scaleToHeight(window.innerHeight)
        canvas.add(img)
        canvas.centerObject(img)
      },
      {
        hasControls: false,
      }
    )
    canvasParentRef.current?.scrollTo({
      top: window.innerHeight / 2,
    })

    canvas.on('mouse:wheel', (opt) => {
      if (!opt.e.ctrlKey) return

      var delta = opt.e.deltaY
      var zoom = canvas.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })
  }, [])

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex justify-center grow preview overflow-auto' ref={canvasParentRef}>
        <canvas ref={canvasNodeRef} />
      </div>
      {/* <div className='bg-gray-500'>
        <input className='w-[75px] text-[14px] text-center' type='number' step={5} defaultValue={100} />
      </div> */}
    </div>
  )
}

export default ImageWindow
