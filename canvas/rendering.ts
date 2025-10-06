import { 
    ShapeData, 
    RectangleData, 
    CircleData, 
    SELECTION_PADDING, 
    HANDLE_SIZE,
    CanvasCoords
} from './type'

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
    const radiusX = shape.width / 2
    const radiusY = shape.height / 2

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

export function getResizeHandles(shape: ShapeData): Array<{x: number, y: number, type: string}> {
    return [
        { x: shape.x - SELECTION_PADDING, y: shape.y - SELECTION_PADDING, type: 'top-left' },
        { x: shape.x + shape.width / 2, y: shape.y - SELECTION_PADDING, type: 'top-middle' },
        { x: shape.x + shape.width + SELECTION_PADDING, y: shape.y - SELECTION_PADDING, type: 'top-right' },
        { x: shape.x - SELECTION_PADDING, y: shape.y + shape.height / 2, type: 'middle-left' },
        { x: shape.x + shape.width + SELECTION_PADDING, y: shape.y + shape.height / 2, type: 'middle-right' },
        { x: shape.x - SELECTION_PADDING, y: shape.y + shape.height + SELECTION_PADDING, type: 'bottom-left' },
        { x: shape.x + shape.width / 2, y: shape.y + shape.height + SELECTION_PADDING, type: 'bottom-middle' },
        { x: shape.x + shape.width + SELECTION_PADDING, y: shape.y + shape.height + SELECTION_PADDING, type: 'bottom-right' }
    ]
}

export function isPointInShape(coords: CanvasCoords, shape: ShapeData): boolean {
    switch (shape.type) {
        case 'rectangle':
            return isPointInRectangle(coords, shape)
        case 'circle':
            return isPointInCircle(coords, shape)
        default:
            return false
    }
}

function isPointInRectangle(coords: CanvasCoords, rect: RectangleData): boolean {
    const tolerance = 3 // click tolerance
    
    const isNearBorder = (
        // top/bottom edges
        (coords.x >= rect.x - tolerance && coords.x <= rect.x + rect.width + tolerance &&
         (Math.abs(coords.y - rect.y) <= tolerance || Math.abs(coords.y - (rect.y + rect.height)) <= tolerance)) ||
        // left/right edges
        (coords.y >= rect.y - tolerance && coords.y <= rect.y + rect.height + tolerance &&
         (Math.abs(coords.x - rect.x) <= tolerance || Math.abs(coords.x - (rect.x + rect.width)) <= tolerance))
    )
    
    return isNearBorder
}

function isPointInCircle(coords: CanvasCoords, circle: CircleData): boolean {
    const centerX = circle.x + circle.width / 2
    const centerY = circle.y + circle.height / 2
    const radiusX = circle.width / 2 + SELECTION_PADDING
    const radiusY = circle.height / 2 + SELECTION_PADDING

    const dx = coords.x - centerX
    const dy = coords.y - centerY

    const normX = dx / radiusX
    const normY = dy / radiusY

    const distanceSquared = normX * normX + normY * normY

    return distanceSquared >= (1 - 0.15) && distanceSquared <= (1 + 0.15)
}

export function isPointInHandle(coords: CanvasCoords, handle: {x: number, y: number, type: string}): boolean {
    const distance = Math.sqrt(
        Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2)
    )
    return distance <= HANDLE_SIZE + 4
}

export function getClickedHandle(coords: CanvasCoords, shape: ShapeData): { x: number, y: number, type: string } | null {
    const handles = getResizeHandles(shape)

    for (const handle of handles) {
        if (isPointInHandle(coords, handle)) {
            return handle
        }
    }

    return null
}

export function isPointInShapeInterior(coords: CanvasCoords, shape: ShapeData): boolean {
    switch (shape.type) {
        case 'rectangle':
            return isPointInRectangleInterior(coords, shape)
        case 'circle':
            return isPointInCircleInterior(coords, shape)
        default:
            return false
    }
}

function isPointInRectangleInterior(coords: CanvasCoords, rect: RectangleData): boolean {
    return (
        coords.x >= rect.x &&
        coords.x <= rect.x + rect.width &&
        coords.y >= rect.y &&
        coords.y <= rect.y + rect.height
    )
}

function isPointInCircleInterior(coords: CanvasCoords, circle: CircleData): boolean {
    const centerX = circle.x + circle.width / 2
    const centerY = circle.y + circle.height / 2
    const radiusX = circle.width / 2
    const radiusY = circle.height / 2

    const dx = coords.x - centerX
    const dy = coords.y - centerY

    const normX = dx / radiusX
    const normY = dy / radiusY

    const distanceSquared = normX * normX + normY * normY

    return distanceSquared <= 1 // Inside the ellipse
}