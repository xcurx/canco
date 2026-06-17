import { getResizeHandles } from './selection'
import {
    CircleData,
    HANDLE_SIZE,
    LineData,
    RectangleData,
    SELECTION_PADDING,
    ShapeData,
    TextData
} from './type'

export function renderLine(ctx: CanvasRenderingContext2D, shape: LineData): void {
    ctx.beginPath()

    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.width + shape.x, shape.height + shape.y)
    ctx.strokeStyle = shape.color
    ctx.stroke()

    if (shape.isSelected) {
        drawSelectionCage(ctx, shape)
    }
}

export function renderRectangle(ctx: CanvasRenderingContext2D, shape: RectangleData): void {
    ctx.beginPath()

    ctx.rect(
        shape.x,
        shape.y,
        shape.width,
        shape.height
    )

    ctx.strokeStyle = shape.color
    ctx.stroke()

    if (shape.isSelected) {
        drawSelectionCage(ctx, shape)
    }
}

export function renderCircle(ctx: CanvasRenderingContext2D, shape: CircleData): void {
    ctx.beginPath()
    const centerX = shape.x + shape.width / 2
    const centerY = shape.y + shape.height / 2
    const radiusX = Math.abs(shape.width / 2)
    const radiusY = Math.abs(shape.height / 2)

    ctx.ellipse(
        centerX,
        centerY,
        radiusX,
        radiusY,
        0,
        0,
        2 * Math.PI
    )
    ctx.strokeStyle = shape.color
    ctx.stroke()

    if (shape.isSelected) {
        drawSelectionCage(ctx, shape)
    }
}

export function renderShape(ctx: CanvasRenderingContext2D, shape: ShapeData): void {
    switch (shape.type) {
        case 'line':
            renderLine(ctx, shape)
            break
        case 'rectangle':
            renderRectangle(ctx, shape)
            break
        case 'circle':
            renderCircle(ctx, shape)
            break
        case 'text':
            renderText(ctx, shape)
            break
        default:
            console.warn(`Unknown shape type: ${(shape as any).type}`)
    }
}

export function renderText(ctx: CanvasRenderingContext2D, shape: TextData): void {
    ctx.beginPath()
    ctx.font = `${shape.fontSize}px sans-serif`
    ctx.fillStyle = shape.color
    ctx.textBaseline = "top"

    let yOffset = 0
    const paragraphs = shape.text.split('\n')
    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ')
        let line = ''
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' '
            const testWidth = ctx.measureText(testLine).width
            
            if (testWidth > shape.width && n > 0) {
                ctx.fillText(line, shape.x, shape.y + yOffset)
                line = words[n] + ' '
                yOffset += shape.fontSize * 1.2
            } else {
                line = testLine
            }
        }
        ctx.fillText(line, shape.x, shape.y + yOffset)
        yOffset += shape.fontSize * 1.2
    })

    if (shape.isSelected) {
        drawSelectionCage(ctx, shape)
    }
}

export function drawSelectionCage(ctx: CanvasRenderingContext2D, shape: ShapeData): void {
    ctx.save()
    const scale = ctx.getTransform().a
    const handles = getResizeHandles(shape, scale)

    if (shape.type !== 'line') {
        const padding = SELECTION_PADDING / scale;
        ctx.setLineDash([5 / scale, 5 / scale])
        ctx.strokeStyle = "#007acc"
        ctx.lineWidth = 1 / scale
        ctx.strokeRect(
            shape.x - padding,
            shape.y - padding,
            shape.width + padding * 2,
            shape.height + padding * 2
        )
    }

    handles.forEach(handle => {
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, HANDLE_SIZE / scale, 0, 2 * Math.PI)
        ctx.fillStyle = '#007acc'
        ctx.fill()
    })

    ctx.restore()
}
