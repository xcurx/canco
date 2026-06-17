import { CanvasCoords, ShapeData } from './type'

export function calculateResize(
    shape: ShapeData, 
    handle: {type: string}, 
    coords: CanvasCoords
): Partial<ShapeData> {
    const newDimensions: Partial<ShapeData> = {}

    switch (handle.type) {
        case 'top-left':
            newDimensions.width = (shape.x + shape.width) - coords.x
            newDimensions.height = (shape.y + shape.height) - coords.y
            newDimensions.x = coords.x
            newDimensions.y = coords.y
            break
        case 'top-right':
            newDimensions.width = coords.x - shape.x
            newDimensions.height = (shape.y + shape.height) - coords.y
            newDimensions.y = coords.y
            break
        case 'bottom-right':
            newDimensions.width = coords.x - shape.x
            newDimensions.height = coords.y - shape.y
            break
        case 'bottom-left':
            newDimensions.width = (shape.x + shape.width) - coords.x
            newDimensions.height = coords.y - shape.y
            newDimensions.x = coords.x
            break
        case 'top-middle':
            newDimensions.height = (shape.y + shape.height) - coords.y
            newDimensions.y = coords.y
            break
        case 'bottom-middle':
            newDimensions.height = coords.y - shape.y
            break
        case 'middle-left':
            newDimensions.width = (shape.x + shape.width) - coords.x
            newDimensions.x = coords.x
            break
        case 'middle-right':
            newDimensions.width = coords.x - shape.x
            break
        case 'start':
            newDimensions.x = coords.x
            newDimensions.y = coords.y
            newDimensions.width = (shape.x + shape.width) - coords.x
            newDimensions.height = (shape.y + shape.height) - coords.y
            break
        case 'end':
            newDimensions.width = coords.x - shape.x
            newDimensions.height = coords.y - shape.y
            break
    }

    // Ensure minimum size
    if (shape.type !== "line" && newDimensions.width !== undefined) {
        newDimensions.width = Math.max(newDimensions.width, 15)
    }
    if (shape.type !== "line" && newDimensions.height !== undefined) {
        newDimensions.height = Math.max(newDimensions.height, 15)
    }

    // Text scaling logic
    if (shape.type === 'text' && newDimensions.width !== undefined && newDimensions.height !== undefined) {
        const textShape = shape as any
        if (handle.type === 'middle-left' || handle.type === 'middle-right') {
            const tempCtx = document.createElement('canvas').getContext('2d')
            if (!tempCtx) throw new Error("Could not get 2D context from canvas")
            
            tempCtx.font = `${textShape.fontSize}px sans-serif`
            let lines = 0
            const paragraphs = textShape.text.split('\n')
            paragraphs.forEach((p:string) => {
                const words = p.split(' ')
                let line = ''
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + (line === '' ? '' : ' ') + words[n]
                    if (tempCtx.measureText(testLine).width > newDimensions.width! && n > 0) {
                        lines++
                        line = words[n]
                    } else {
                        line = testLine
                    }
                }
                lines++
            })
            newDimensions.height = (lines) * textShape.fontSize * 1.2
        } else {
            const widthRatio = newDimensions.width / shape.width;
            (newDimensions as any).fontSize = textShape.fontSize * widthRatio
            newDimensions.height = shape.height * widthRatio
        }
    }

    return newDimensions
}
