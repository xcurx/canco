import { RendererContext } from '@/components/renderer-context'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { render } from '../canvas/animate'
import { ShapeData } from '@/canvas/type';

interface CanvasProps {
    roomId: string;
}

const Canvas = ({ roomId }: CanvasProps) => {
    const canvas = useRef<HTMLCanvasElement | null>(null)
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
    const [editingText, setEditingText] = useState<ShapeData | null>(null)

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
        const renderer = render(ctx, canvas.current!, roomId)
        setRenderer(renderer)
      }
    }, [ctx, roomId])

    useEffect(() => {
        if (renderer) {
          renderer.setEditTextCallback((shape) => {
            setEditingText(shape)
          })
        }
    }, [renderer])

    const handleTextSubmit = (newText: string) => {
      if (editingText && renderer) {
        renderer.updateText(editingText.id, newText, editingText)
        setEditingText(null)
      }
    }

  return (
    <div className='w-full h-full'>
      <canvas ref={canvas} style={{backgroundColor:"#121212"}}></canvas>

      {editingText && renderer && (
            <textarea
                autoFocus
                defaultValue={(editingText as any).text}
                onBlur={(e) => handleTextSubmit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') handleTextSubmit(e.currentTarget.value)
                }}
                style={{
                    position: 'absolute',
                    // align textarea to camera pan and zoom
                    left: renderer.getCamera().worldToScreen(editingText.x, editingText.y).x,
                    top: renderer.getCamera().worldToScreen(editingText.x, editingText.y).y,
                    width: editingText.width * renderer.getCamera().scale,
                    height: editingText.height * renderer.getCamera().scale,
                    fontSize: `${(editingText as any).fontSize * renderer.getCamera().scale}px`,
                    color: editingText.color,
                    background: 'transparent',
                    border: '1px dashed #007acc',
                    outline: 'none',
                    resize: 'none',
                    padding: 0,
                    margin: 0,
                    lineHeight: 1.2,
                    zIndex: 50,
                }}
            />
      )}
    </div>
  )
}

export default Canvas