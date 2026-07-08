import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState, createCircleData, createLineData, createRectangleData, createTextData } from '../state'
import { isShapeViable, updateTempShape } from '../utils'

export class CreateHandler implements InteractionHandler {
    private tempShape: ShapeData | null = null

    constructor(private context: InteractionContext, private startPoint: CanvasCoords) {
        this.tempShape = this.createShapeFromTool(startPoint)
        if (this.tempShape) {
            this.context.changeState(CanvasStateEnum.CREATING_SHAPE)
            this.context.updateTempShape(this.tempShape)
        }
    }

    onMouseMove(coords: CanvasCoords, e: PointerEvent): void {
        if (this.tempShape) {
            this.tempShape = updateTempShape(this.tempShape, this.startPoint, coords)
            this.context.updateTempShape(this.tempShape)
        }
    }

    onMouseUp(coords: CanvasCoords, e: PointerEvent): void {
        if (this.tempShape && isShapeViable(this.tempShape)) {
            this.context.applyOperation(CanvasState.createShape(this.tempShape), true)
            if (this.tempShape.type === 'text') {
                this.context.onEditText?.(this.tempShape)
                this.context.toolManager.clearTool()
                this.context.applyOperation(CanvasState.selectShape(this.tempShape.id), false)
            }
        }
    }

    cleanup(): void {
        this.context.updateTempShape(null) 
        this.context.toolManager.clearTool() 
    }

    private createShapeFromTool(coords: CanvasCoords): ShapeData | null {
        const tool = this.context.toolManager.getCurrentTool()
        const color = this.context.toolManager.getColor()
        switch (tool) {
            case 'rectangle': return createRectangleData(coords.x, coords.y, 0, 0, color)
            case 'circle':    return createCircleData(coords.x, coords.y, 0, 0, color)
            case 'line':      return createLineData(coords.x, coords.y, coords.x, coords.y, color)
            case 'text':      return createTextData(coords.x, coords.y, color, "")
            default:          return null
        }
    }
}
