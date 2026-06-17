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

    const { setRenderer } = useContext(RendererContext)

    useEffect(() => {
        if(canvas.current){
          canvas.current.width = innerWidth
          canvas.current.height = innerHeight
          setCtx(canvas.current.getContext('2d'))
        }
    },[])

    useEffect(() => {
      if(ctx){
        const renderer = render(ctx, canvas.current!, roomId)
        setRenderer(renderer)
      }
    }, [ctx, roomId])

  return (
    <div className='w-full h-full'>
      <canvas ref={canvas} style={{backgroundColor:"#121212"}}></canvas>
      <EditTextarea/>
    </div>
  )
}

export default Canvas