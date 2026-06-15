import { 
    ShapeData, 
    RectangleData, 
    CircleData, 
    SELECTION_PADDING, 
    HANDLE_SIZE,
    CanvasCoords,
    LineData
} from './type'

export function getResizeHandles(shape: ShapeData, scale: number = 1): Array<{x: number, y: number, type: string}> {
    if (shape.type === 'line') {
        return [
            { x: shape.x, y: shape.y, type: 'start' },
            { x: shape.x + shape.width, y: shape.y + shape.height, type: 'end' }
        ]
    }

    const padding = SELECTION_PADDING / scale
     
    return [
        { x: shape.x - padding, y: shape.y - padding, type: 'top-left' },
        { x: shape.x + shape.width / 2, y: shape.y - padding, type: 'top-middle' },
        { x: shape.x + shape.width + padding, y: shape.y - padding, type: 'top-right' },
        { x: shape.x - padding, y: shape.y + shape.height / 2, type: 'middle-left' },
        { x: shape.x + shape.width + padding, y: shape.y + shape.height / 2, type: 'middle-right' },
        { x: shape.x - padding, y: shape.y + shape.height + padding, type: 'bottom-left' },
        { x: shape.x + shape.width / 2, y: shape.y + shape.height + padding, type: 'bottom-middle' },
        { x: shape.x + shape.width + padding, y: shape.y + shape.height + padding, type: 'bottom-right' }
    ]
}

export function isPointInShape(coords: CanvasCoords, shape: ShapeData): boolean {
    switch (shape.type) {
        case 'line':
            return isPointInLine(coords, shape)
        case 'rectangle':
            return isPointInRectangle(coords, shape)
        case 'circle':
            return isPointInCircle(coords, shape)
        default:
            return false
    }
}

function isPointInLine(coords: CanvasCoords, line: LineData): boolean {
    const tolerance = 5 // click tolerance
    const x1 = line.x
    const y1 = line.y
    const x2 = line.x + line.width
    const y2 = line.y + line.height

    const A = coords.x - x1
    const B = coords.y - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const len_sq = C * C + D * D
    let param = -1
    if (len_sq !== 0) // in case of 0 length line
        param = dot / len_sq

    let xx, yy

    if (param < 0) {
        xx = x1
        yy = y1
    }
    else if (param > 1) {
        xx = x2
        yy = y2
    }
    else {
        xx = x1 + param * C
        yy = y1 + param * D
    }

    const dx = coords.x - xx
    const dy = coords.y - yy
    return (dx * dx + dy * dy) <= tolerance * tolerance 
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

export function isPointInHandle(coords: CanvasCoords, handle: {x: number, y: number, type: string}, scale: number = 1): boolean {
    const distance = Math.sqrt(
        Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2)
    )
    return distance <= (HANDLE_SIZE + 4) / scale
}

export function getClickedHandle(coords: CanvasCoords, shape: ShapeData, scale: number = 1): { x: number, y: number, type: string } | null {
    const handles = getResizeHandles(shape, scale)

    for (const handle of handles) {
        if (isPointInHandle(coords, handle, scale)) {
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