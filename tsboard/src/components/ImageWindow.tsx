import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import SampleImage01 from '../assets/images/sample_01.jpg'
import * as fabric from 'fabric'

function ImageWindow() {
  const canvasWindowRef = useRef<HTMLDivElement>(null)
  const canvasNodeRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<fabric.Canvas>()
  const zoomInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<any>(null)

  useLayoutEffect(() => {
    document.addEventListener('wheel', handlePanZoom, { passive: false })
    listen('open_file', (e: any) => {
      console.log(e.payload)
      initCanvas(convertFileSrc(e.payload.path))
    })

    return () => {
      canvasRef.current?.dispose()
      document.removeEventListener('wheel', handlePanZoom)
    }
  }, [])

  const initCanvas = async (imageUrl) => {
    console.log('initCanvas', imageUrl)
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
      // あれ？なんで逆になるんだろう、でも効果が良いっぽい
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

  const handlePanZoom = (e: React.WheelEvent<HTMLDivElement> | any) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    e.stopPropagation()

    const delta = e.deltaY
    let zoom = parseFloat(zoomInputRef.current!.value) / 100
    zoom *= 0.999 ** delta
    if (zoom > 20) zoom = 20
    if (zoom < 0.01) zoom = 0.01

    const canvas = canvasRef.current!
    canvas.setDimensions({ height: canvas.height * zoom, width: canvas.width * zoom }, { cssOnly: true })
    displayZoomWithUnit(zoom)
  }

  return (
    <>
      <div className='flex grow justify-center preview overflow-auto pb-[1rem]' ref={canvasWindowRef}>
        <canvas ref={canvasNodeRef} />
      </div>
      <div className='flex fixed bottom-0 w-full bg-base-200 h-[1rem] leading-[1rem] opacity-70'>
        <input
          ref={zoomInputRef}
          onBlur={handleZoomChange}
          onKeyDown={handleZoomEnter}
          className='w-[75px] text-[12px] text-center focus:outline-none bg-slate-900 opacity-100'
          type='text'
          onChange={(e) => (zoomInputRef.current!.value = e.target.value)}
        />
        <span className='text-[10px] px-5 bg-black'>{`770 px x 1080 px (72 ppi)`}</span>
      </div>
    </>
  )
}

export default ImageWindow
