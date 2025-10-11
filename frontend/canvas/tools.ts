import { ShapeData, CanvasCoords, RectangleData, CircleData } from './type'
import { createRectangleData, createCircleData, createLineData } from './state'

export type ToolType = 'rectangle' | 'circle' | 'line' | null

export class ToolManager {
    private currentTool: ToolType = null
    private color: string = 'white'
    private strokeWidth: number = 2

    setCurrentTool(tool: ToolType): void {
        this.currentTool = tool
        console.log(`Tool changed to: ${tool || 'none'}`)
    }

    getCurrentTool(): ToolType {
        return this.currentTool
    }

    hasActiveTool(): boolean {
        return this.currentTool !== null
    }

    createShape(startCoords: CanvasCoords): ShapeData | null {
        if (!this.currentTool) {
            console.warn('No tool selected for shape creation')
            return null
        }

        switch (this.currentTool) {
            case 'rectangle':
                return createRectangleData(
                    startCoords.x, 
                    startCoords.y, 
                    0, 
                    0, 
                    this.color
                )
            
            case 'circle':
                return createCircleData(
                    startCoords.x, 
                    startCoords.y, 
                    0, 
                    0, 
                    this.color
                )
            
            case 'line':
                return createLineData(
                    startCoords.x, 
                    startCoords.y, 
                    startCoords.x, 
                    startCoords.y, 
                    this.color, 
                )
            
            default:
                console.warn(`Unknown tool: ${this.currentTool}`)
                return null
        }
    }

    updateTempShape(
        shape: ShapeData, 
        startCoords: CanvasCoords, 
        currentCoords: CanvasCoords
    ): ShapeData {
        const width = currentCoords.x - startCoords.x
        const height = currentCoords.y - startCoords.y

        if (shape.type === 'line') {
            return {
                ...shape,
                x: startCoords.x,
                y: startCoords.y,
                width,
                height
            }
        }

        const updatedShape: ShapeData = {
            ...shape,
            x: width < 0 ? currentCoords.x : startCoords.x,
            y: height < 0 ? currentCoords.y : startCoords.y,
            width: width < 0 ? startCoords.x - currentCoords.x : width,
            height: height < 0 ? startCoords.y - currentCoords.y : height
        }

        return updatedShape
    }

    isShapeViable(shape: ShapeData, minSize: number = 15): boolean {
        return Math.abs(shape.width) > minSize && Math.abs(shape.height) > minSize
    }

    setColor(color: string): void {
        this.color = color
        console.log(`Tool color changed to: ${color}`)
    }

    getColor(): string {
        return this.color
    }

    setStrokeWidth(width: number): void {
        this.strokeWidth = Math.max(1, width) // Minimum width of 1
        console.log(`Stroke width changed to: ${this.strokeWidth}`)
    }

    getStrokeWidth(): number {
        return this.strokeWidth
    }

    clearTool(): void {
        this.currentTool = null
        console.log('Tool cleared')
    }
}