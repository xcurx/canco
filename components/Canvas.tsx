import { RendererContext } from '@/app/page'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { render } from '../canvas/animate'
// import { RendererContext } from '../App'

const Canvas = () => {
    const canvas = useRef<HTMLCanvasElement | null>(null)
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)

    const { setRenderer, renderer } = useContext(RendererContext)

    useEffect(() => {
        if(canvas.current){
            canvas.current.width = innerWidth
            canvas.current.height = innerHeight
            setCtx(canvas.current.getContext('2d'))
        }
    },[])

    useEffect(() => {
      if(ctx){
          console.log("context set");
          const renderer = render(ctx, canvas.current!)
          console.log("renderer created: ", renderer);
          setRenderer(renderer)
      }
    }, [ctx])

    console.log("renderer in canvas: ", renderer);
    
  return (
    <div className='w-full h-full'>
          <canvas ref={canvas} style={{backgroundColor:"#121212"}}></canvas>
    </div>
  )
}

export default Canvas
