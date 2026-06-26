import { ShapeData } from '@/canvas/type'
import { wrapText } from '@/canvas/utils';
import { useContext, useEffect, useState } from 'react';
import { RendererContext } from './renderer-context';

export const EditTextarea = () => {
    const [editingText, setEditingText] = useState<ShapeData | null>(null)
    const [isFixedSize, setIsFixedSize] = useState(false)
    const { renderer } = useContext(RendererContext)

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

    if (!editingText || !renderer) return null

    const scale = renderer.getCamera().scale
    const pos = renderer.getCamera().worldToScreen(editingText.x, editingText.y)

    const scaledFontSize = ((editingText as any).fontSize || 24) * scale
    const topOffset = scaledFontSize * 0.173 // tested value to minimize text offset while editing

    return (
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
                left: pos.x,
                top: pos.y - topOffset,
                transform: `rotate(${editingText.rotation || 0}deg) translateY(-${topOffset}px)`,
                transformOrigin: `${(editingText.width * scale) / 2}px ${(editingText.height * scale) / 2}px`,
                minWidth: '20px',
                width: `${Math.max(20, editingText.width * scale)}px`,
                height: `${Math.max(28.8, editingText.height * scale)}px`,
                fontSize: `${scaledFontSize}px`,
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
                background: 'transparent',
                border: 'none',
                fontFamily: 'sans-serif',
            }}
        />
    )
}