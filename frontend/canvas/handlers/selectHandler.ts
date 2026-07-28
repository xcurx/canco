import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState, createRectangleData } from '../state'
import { getRotatedCorners, updateTempShape } from '../utils'

export class SelectHandler implements InteractionHandler {
    private tempShape: ShapeData | null = null
    
    constructor(private context: InteractionContext, private startPoint: CanvasCoords) {
        // temp seletion box
        this.tempShape = createRectangleData(startPoint.x, startPoint.y, 0, 0, "rgba(0, 122, 204, 0.6)", 0, 1, 1, "rgba(0, 122, 204, 0.1)")
        
        this.context.changeState(CanvasStateEnum.SELECTING_MULTIPLE)
        this.context.updateTempShape(this.tempShape)
    }

    onMouseMove(coords: CanvasCoords, e: PointerEvent): void {
        if (this.tempShape) {
            this.tempShape = updateTempShape(this.tempShape, this.startPoint, coords)
            this.context.updateTempShape(this.tempShape)
            const updates = this.applySelection()
        
            // apply without saving to history to not spam the undo stack
            this.context.applyOperation(CanvasState.updateShapes(updates), false)
        }
    }

    onMouseUp(coords: CanvasCoords, e: PointerEvent): void {
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
        const isTooSmall = Math.abs(this.tempShape.width) < 3 && Math.abs(this.tempShape.height) < 3
        
        const updates = shapes.map(s => {
            const corners = getRotatedCorners(s);
            
            // to calculate intersection with the tempShape which can have negative width/height
            const tempMinX = Math.min(this.tempShape!.x, boxRight)
            const tempMaxX = Math.max(this.tempShape!.x, boxRight)
            const tempMinY = Math.min(this.tempShape!.y, boxBottom)
            const tempMaxY = Math.max(this.tempShape!.y, boxBottom)

            const isInside = !isTooSmall && corners.every(c => 
                c.x >= tempMinX && 
                c.x <= tempMaxX && 
                c.y >= tempMinY && 
                c.y <= tempMaxY
            );
                
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