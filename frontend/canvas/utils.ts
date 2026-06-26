import { unrotateCoords } from './selection'
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
        if (newDimensions.width < 15) {
            newDimensions.width = 15
            if (['top-left', 'middle-left', 'bottom-left'].includes(handle.type)) {
                newDimensions.x = (shape.x + shape.width) - 15
            }
        }
    }
    if (shape.type !== "line" && newDimensions.height !== undefined) {
        if (newDimensions.height < 15) {
            newDimensions.height = 15
            if (['top-left', 'top-middle', 'top-right'].includes(handle.type)) {
                newDimensions.y = (shape.y + shape.height) - 15
            }
        }
    }

    // Text scaling logic
    if (shape.type === 'text') {
        const textShape = shape as any
        if (handle.type === 'middle-left' || handle.type === 'middle-right') {
            if (newDimensions.width !== undefined) {
                const tempCtx = document.createElement('canvas').getContext('2d')
                if (!tempCtx) throw new Error("Could not get 2D context from canvas")
                
                tempCtx.font = `${textShape.fontSize}px sans-serif`
                
                let minAllowedWidth = 15;
                for (const char of textShape.text) {
                    minAllowedWidth = Math.max(minAllowedWidth, tempCtx.measureText(char).width);
                }
                
                if (newDimensions.width < minAllowedWidth) {
                    newDimensions.width = minAllowedWidth;
                    if (handle.type === 'middle-left') {
                        newDimensions.x = (shape.x + shape.width) - minAllowedWidth;
                    }
                }
                
                const lines = wrapText(tempCtx, textShape.text, newDimensions.width)
                newDimensions.height = (lines.length) * textShape.fontSize * 1.2
            }
        } else if (handle.type === 'top-middle' || handle.type === 'bottom-middle') {
            if (newDimensions.height !== undefined) {
                const heightRatio = newDimensions.height / shape.height;
                (newDimensions as any).fontSize = textShape.fontSize * heightRatio;
                newDimensions.width = shape.width * heightRatio;
            }
        } else if (newDimensions.height !== undefined && newDimensions.width !== undefined) {
            const widthRatio = newDimensions.width / shape.width;
            (newDimensions as any).fontSize = textShape.fontSize * widthRatio;
            newDimensions.height = shape.height * widthRatio
        }
    }

    return newDimensions
}

export function calculateRotatedResize(
    shape: ShapeData, 
    handle: {type: string}, 
    coords: CanvasCoords
): Partial<ShapeData> {
    const unrotatedCoords = unrotateCoords(coords, shape)
    const newDimensions = calculateResize(shape, handle, unrotatedCoords)

    if (shape.rotation) {
        // find old center
        const oldCenterX = shape.x + shape.width / 2
        const oldCenterY = shape.y + shape.height / 2
        
        // find new local center based on new dimensions (fallback to old if unchanged)
        const newLocalX = newDimensions.x !== undefined ? newDimensions.x : shape.x
        const newLocalY = newDimensions.y !== undefined ? newDimensions.y : shape.y
        const newLocalW = newDimensions.width !== undefined ? newDimensions.width : shape.width
        const newLocalH = newDimensions.height !== undefined ? newDimensions.height : shape.height
        
        const newLocalCenterX = newLocalX + newLocalW / 2
        const newLocalCenterY = newLocalY + newLocalH / 2
        
        // shift of center in local space
        const dxLocal = newLocalCenterX - oldCenterX
        const dyLocal = newLocalCenterY - oldCenterY
        
        // rotate this shift back to world space
        const angleInRadians = (shape.rotation * Math.PI) / 180;
        const dxWorld = dxLocal * Math.cos(angleInRadians) - dyLocal * Math.sin(angleInRadians);
        const dyWorld = dxLocal * Math.sin(angleInRadians) + dyLocal * Math.cos(angleInRadians);
        
        // true world center
        const newWorldCenterX = oldCenterX + dxWorld
        const newWorldCenterY = oldCenterY + dyWorld
        
        // final top-left coordinates that keep the opposite corner fixed in world space
        newDimensions.x = newWorldCenterX - newLocalW / 2
        newDimensions.y = newWorldCenterY - newLocalH / 2
    }
    return newDimensions
}

export function wrapText(
    ctx: CanvasRenderingContext2D, 
    text: string, 
    maxWidth: number
): string[] {
    const lines: string[] = []
    const paragraphs = (text || '').split('\n')

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ')
        let currentLine = ''

        for (let i = 0; i < words.length; i++) {
            const word = words[i]
            const space = currentLine === '' ? '' : ' '
            const testLine = currentLine + space + word

            // when whole word fits on the current line
            if (ctx.measureText(testLine).width <= maxWidth) {
                currentLine = testLine
            } else {
                // when word fits by itself so push the current line and start a new one
                if (currentLine !== '' && ctx.measureText(word).width <= maxWidth) {
                    lines.push(currentLine)
                    currentLine = word
                } else {
                    // when word is too long for the box so break it by character.
                    if (currentLine !== '') {
                        lines.push(currentLine)
                        currentLine = ''
                    }

                    for (let j = 0; j < word.length; j++) {
                        const char = word[j]
                        const testCharLine = currentLine + char
                        
                        if (ctx.measureText(testCharLine).width <= maxWidth) {
                            currentLine = testCharLine
                        } else {
                            if (currentLine !== '') {
                                lines.push(currentLine)
                                currentLine = char
                            } else {
                                // force every character on new line
                                lines.push(char)
                                currentLine = ''
                            }
                        }
                    }
                }
            }
        }
        
        // push the last remaining line or preserve explicit empty lines (like \n\n)
        if (currentLine !== '' || (words.length === 1 && words[0] === '')) {
            lines.push(currentLine)
        }
    })

    return lines
}