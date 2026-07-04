import { RendererContext } from '@/components/renderer-context'
import { useContext, useEffect, useRef, useState } from 'react'
import { render } from '../canvas/animate'
import { EditTextarea } from './EditTextArea';

interface CanvasProps {
    roomId: string;
}

const Canvas = ({ roomId }: CanvasProps) => {
    const canvas = useRef<HTMLCanvasElement | null>(null)
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)

    const { renderer, setRenderer } = useContext(RendererContext)

    useEffect(() => {
        const handleResize = () => {
            if (canvas.current) {
                const dpr = window.devicePixelRatio || 1
                canvas.current.width = window.innerWidth * dpr
                canvas.current.height = window.innerHeight * dpr
                canvas.current.style.width = `${window.innerWidth}px`
                canvas.current.style.height = `${window.innerHeight}px`
                
                if (!ctx) setCtx(canvas.current.getContext('2d'))
                
                if (renderer) {
                    renderer.render()
                }
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [ctx, renderer])

    useEffect(() => {
      if(ctx){
        const renderer = render(ctx, canvas.current!, roomId)
        setRenderer(renderer)
      }
    }, [ctx, roomId])

  return (
    <div className='w-full h-full'>
      <canvas ref={canvas} style={{backgroundColor:"#121212", touchAction: "none"}}></canvas>
      <EditTextarea/>
    </div>
  )
}

export default Canvas