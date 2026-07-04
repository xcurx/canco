import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState } from '../state'

export class MoveHandler implements InteractionHandler {
    private dragOffset: CanvasCoords
    private originalShapes: ShapeData[]
    private isMultiSelect: boolean

    constructor(private context: InteractionContext, startCoords: CanvasCoords, shapesToMove: ShapeData[]) {
        this.isMultiSelect = shapesToMove.length > 1
        this.originalShapes = shapesToMove.map(s => ({ ...s }))
        
        if (this.isMultiSelect) {
            this.dragOffset = { x: startCoords.x, y: startCoords.y }
        } else {
            this.dragOffset = {
                x: startCoords.x - shapesToMove[0].x,
                y: startCoords.y - shapesToMove[0].y
            }
        }
        this.context.changeState(CanvasStateEnum.MOVING_OBJECT)
    }

    onMouseMove(coords: CanvasCoords, e: PointerEvent): void {
        this.applyMove(coords, false)
    }

    onMouseUp(coords: CanvasCoords, e: PointerEvent): void {
        this.applyMove(coords, true)
    }

    private applyMove(coords: CanvasCoords, saveToHistory: boolean) {
        if (this.isMultiSelect) {
            const dx = coords.x - this.dragOffset.x
            const dy = coords.y - this.dragOffset.y
            const updates = this.originalShapes.map(orig => ({
                id: orig.id,
                changes: { x: orig.x + dx, y: orig.y + dy }
            }))
            this.context.applyOperation(CanvasState.updateShapes(updates), saveToHistory)
        } else {
            const newX = coords.x - this.dragOffset.x
            const newY = coords.y - this.dragOffset.y
            this.context.applyOperation(
                CanvasState.updateShape(this.originalShapes[0].id, { x: newX, y: newY }), 
                saveToHistory, 
                this.originalShapes[0]
            )
        }
    }
}
