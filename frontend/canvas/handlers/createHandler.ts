import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState } from '../state'

export class CreateHandler implements InteractionHandler {
    private tempShape: ShapeData | null = null

    constructor(private context: InteractionContext, private startPoint: CanvasCoords) {
        this.tempShape = this.context.toolManager.createShape(startPoint)
        if (this.tempShape) {
            this.context.changeState(CanvasStateEnum.CREATING_SHAPE)
            this.context.updateTempShape(this.tempShape)
        }
    }

    onMouseMove(coords: CanvasCoords, e: MouseEvent): void {
        if (this.tempShape) {
            this.tempShape = this.context.toolManager.updateTempShape(this.tempShape, this.startPoint, coords)
            this.context.updateTempShape(this.tempShape)
        }
    }

    onMouseUp(coords: CanvasCoords, e: MouseEvent): void {
        if (this.tempShape && this.context.toolManager.isShapeViable(this.tempShape)) {
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
}
