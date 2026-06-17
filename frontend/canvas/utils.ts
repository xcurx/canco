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
    if (shape.type === 'text') {
        const textShape = shape as any
        if (handle.type === 'middle-left' || handle.type === 'middle-right') {
            if (newDimensions.width !== undefined) {
                const tempCtx = document.createElement('canvas').getContext('2d')
                if (!tempCtx) throw new Error("Could not get 2D context from canvas")
                
                tempCtx.font = `${textShape.fontSize}px sans-serif`
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
                        currentLine += space
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