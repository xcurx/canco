import { getResizeHandles } from './interaction'
import {
    CircleData,
    HANDLE_SIZE,
    LineData,
    RectangleData,
    SELECTION_PADDING,
    ShapeData
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
        default:
            console.warn(`Unknown shape type: ${(shape as any).type}`)
    }
}

export function drawSelectionCage(ctx: CanvasRenderingContext2D, shape: ShapeData): void {
    const handles = getResizeHandles(shape)

    if (shape.type !== 'line') {
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = "#007acc"
        ctx.lineWidth = 1
        ctx.strokeRect(
            shape.x - SELECTION_PADDING,
            shape.y - SELECTION_PADDING,
            shape.width + SELECTION_PADDING * 2,
            shape.height + SELECTION_PADDING * 2
        )
        ctx.setLineDash([])
    }

    handles.forEach(handle => {
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, HANDLE_SIZE, 0, 2 * Math.PI)
        ctx.fillStyle = '#007acc'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
    })
}
