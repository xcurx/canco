import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState, createRectangleData } from '../state'

export class SelectHandler implements InteractionHandler {
    private tempShape: ShapeData | null = null
    
    constructor(private context: InteractionContext, private startPoint: CanvasCoords) {
        // temp seletion box
        this.tempShape = createRectangleData(startPoint.x, startPoint.y, 0, 0, "rgba(0, 122, 204, 0.6)", 0, "rgba(0, 122, 204, 0.1)")
        
        this.context.changeState(CanvasStateEnum.SELECTING_MULTIPLE)
        this.context.updateTempShape(this.tempShape)
    }

    onMouseMove(coords: CanvasCoords, e: MouseEvent): void {
        if (this.tempShape) {
            this.tempShape = this.context.toolManager.updateTempShape(this.tempShape, this.startPoint, coords)
            this.context.updateTempShape(this.tempShape)
            const updates = this.applySelection()
        
            // apply without saving to history to not spam the undo stack
            this.context.applyOperation(CanvasState.updateShapes(updates), false)
        }
    }

    onMouseUp(coords: CanvasCoords, e: MouseEvent): void {
        if (this.tempShape) {
            const updates = this.applySelection()
            this.context.applyOperation(CanvasState.updateShapes(updates), true)
        }
    }

    private applySelection(): Array<{
        id: string,
        changes: Partial<ShapeData>
    }> {
        if (!this.tempShape) return []

        const canvasState = this.context.getCanvasState()
        const shapes = canvasState.getAllShapes()
        const boxRight = this.tempShape.x + this.tempShape.width
        const boxBottom = this.tempShape.y + this.tempShape.height
        
        const updates = shapes.map(s => {
            const minX = Math.min(s.x, s.x + s.width)
            const maxX = Math.max(s.x, s.x + s.width)
            const minY = Math.min(s.y, s.y + s.height)
            const maxY = Math.max(s.y, s.y + s.height)
            
            const isInside = 
                minX < boxRight &&
                maxX > this.tempShape!.x &&
                minY < boxBottom &&
                maxY > this.tempShape!.y
                
            return {
                id: s.id,
                changes: { isSelected: isInside }
            }
        })
        return updates
    }

    cleanup(): void {
        this.context.updateTempShape(null)
        this.context.changeState(CanvasStateEnum.IDLE)
    }
}