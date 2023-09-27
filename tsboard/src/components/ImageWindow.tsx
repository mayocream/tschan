import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import SampleImage01 from '../assets/images/sample_01.jpg'
import * as fabric from 'fabric'

function ImageWindow({ imageUrl = SampleImage01 }) {
  const canvasWindowRef = useRef<HTMLDivElement>(null)
  const canvasNodeRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<fabric.Canvas>()
  const zoomInputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    initCanvas()

    return () => {
      canvasRef.current?.dispose()
    }
  }, [])

  const initCanvas = async () => {
    // canvas size equal to image size (retina display)
    const img = await fabric.Image.fromURL(imageUrl, {}, {})
    const canvas = new fabric.Canvas(canvasNodeRef.current!, {
      backgroundImage: img,
    })
    canvas.setDimensions({ height: img.height, width: img.width }, { backstoreOnly: true })
    canvas.renderAll()
    canvasRef.current = canvas

    // zoom canvas to fit screen
    if (img.height > window.innerHeight) {
      const zoom = window.innerHeight / img.height
      canvas.setDimensions({ height: window.innerHeight, width: zoom * img.width }, { cssOnly: true })
      displayZoomWithUnit(zoom)
    }
    if (img.width > canvasWindowRef.current!.clientWidth) {
      const zoom = canvasWindowRef.current!.clientWidth / img.width
      canvas.setDimensions({ height: zoom * img.height, width: canvasWindowRef.current!.clientWidth }, { cssOnly: true })
      displayZoomWithUnit(zoom)
    }
  }

  const displayZoomWithUnit = (zoom: number) => {
    zoomInputRef.current!.value = `${(zoom * 100).toPrecision(4)}%`
  }

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zoom = parseFloat(e.target.value) / 100

    const canvas = canvasRef.current!
    canvas.setDimensions({ height: canvas.height * zoom, width: canvas.width * zoom }, { cssOnly: true })
    displayZoomWithUnit(zoom)
  }

  const handleZoomEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      zoomInputRef.current?.blur()
    }
  }

  return (
    <>
      <div className='flex grow justify-center preview overflow-auto' ref={canvasWindowRef}>
        <canvas ref={canvasNodeRef} />
      </div>
      <div className='flex fixed bottom-0 w-full bg-base-200 h-[.8rem] opacity-70'>
        <input
          ref={zoomInputRef}
          onBlur={handleZoomChange}
          onKeyDown={handleZoomEnter}
          className='w-[75px] text-[12px] text-center focus:outline-none bg-base-content'
          type='text'
          onChange={(e) => (zoomInputRef.current!.value = e.target.value)}
        />
      </div>
    </>
  )
}

export default ImageWindow
