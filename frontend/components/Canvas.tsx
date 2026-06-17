import { RendererContext } from '@/components/renderer-context'
import { useContext, useEffect, useRef, useState } from 'react'
import { render } from '../canvas/animate'
import { ShapeData } from '@/canvas/type';
import { wrapText } from '@/canvas/utils';

interface CanvasProps {
    roomId: string;
}

const Canvas = ({ roomId }: CanvasProps) => {
    const canvas = useRef<HTMLCanvasElement | null>(null)
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
    const [editingText, setEditingText] = useState<ShapeData | null>(null)
    const [isFixedSize, setIsFixedSize] = useState(false)

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
            renderer.setEditingShapeId(shape.id)

            if (shape.type === 'text' && (shape as any).text !== '') {
                const tempCtx = document.createElement('canvas').getContext('2d')
                if (tempCtx) {
                    const fontSize = (shape as any).fontSize || 24
                    tempCtx.font = `${fontSize}px sans-serif`
                    let oldIntrinsicWidth = 0
                    ;(shape as any).text.split('\n').forEach((line: string) => {
                        oldIntrinsicWidth = Math.max(oldIntrinsicWidth, tempCtx.measureText(line).width)
                    })
                    oldIntrinsicWidth = Math.ceil(oldIntrinsicWidth) + 2
                    
                    // If difference is > 5px, it means you manually shrank or expanded it!
                    setIsFixedSize(Math.abs(shape.width - oldIntrinsicWidth) > 5)
                }
            } else {
                setIsFixedSize(false)
            }
          })
        }
    }, [renderer])

    const handleTextSubmit = (newText: string) => {
      if (renderer) renderer.setEditingShapeId(null)
      if (!newText.trim() && editingText && renderer) {
          renderer.deleteShape(editingText.id)
          setEditingText(null)
          return
      }
      if (editingText && renderer) {
          const tempCtx = document.createElement('canvas').getContext('2d')
          if (tempCtx) {
              // Add fallback to 24 if fontSize is missing!
              const fontSize = (editingText as any).fontSize || 24
              tempCtx.font = `${fontSize}px sans-serif`
              const lines = newText.split('\n')
              let maxWidth = 0
              lines.forEach(line => {
                  maxWidth = Math.max(maxWidth, tempCtx.measureText(line).width)
              })
              // small 2px buffer to prevent extra width wrapping error
              maxWidth = Math.ceil(maxWidth) + 2

              if (isFixedSize) {
                maxWidth = editingText.width
              }

              const wrappedLines = wrapText(tempCtx, newText, maxWidth)
              const newHeight = wrappedLines.length * fontSize * 1.2
              renderer.updateText(editingText.id, newText, maxWidth, newHeight, editingText)
          }
      }
      setEditingText(null)
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
            ref={(el) => {
                if (el) {
                    el.style.height = '0px'
                    el.style.height = `${el.scrollHeight}px`
                    if (!isFixedSize) {
                      el.style.width = '0px'
                      el.style.width = `${el.scrollWidth + 10}px`
                    }
                }
            }}
            onInput={(e) => {
                // auto expand
                const target = e.target as HTMLTextAreaElement
                target.style.height = '0px'
                target.style.height = `${target.scrollHeight}px`
                if (!isFixedSize) {
                  target.style.width = '0px'
                  target.style.width = `${target.scrollWidth + 10}px`
                }
            }}
            style={{
                position: 'absolute',
                left: renderer.getCamera().worldToScreen(editingText.x, editingText.y).x,
                top: renderer.getCamera().worldToScreen(editingText.x, editingText.y).y,
                minWidth: '20px',
                width: `${Math.max(20, editingText.width * renderer.getCamera().scale)}px`,
                height: `${Math.max(28.8, editingText.height * renderer.getCamera().scale)}px`,
                fontSize: `${((editingText as any).fontSize || 24) * renderer.getCamera().scale}px`,
                color: editingText.color,
                outline: 'none',
                resize: 'none',
                padding: 0,
                margin: 0,
                lineHeight: 1.2,
                zIndex: 50,
                overflow: 'hidden',
                whiteSpace: isFixedSize ? 'pre-wrap' : 'pre',
                wordBreak: isFixedSize ? 'break-word' : 'normal',
            }}
        />
      )}
    </div>
  )
}

export default Canvas