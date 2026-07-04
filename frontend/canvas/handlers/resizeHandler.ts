import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState } from '../state'
import { getShapesBoundingBox, getMultiResizeUpdates, BoundingBox, calculateRotatedResize } from '../utils'

export class ResizeHandler implements InteractionHandler {
    private originalShapes: ShapeData[]
    private originalBoundingBox: BoundingBox | null = null
    private isMultiSelect: boolean

    constructor(
        private context: InteractionContext,
        private resizeHandle: { type: string },
        shapesToResize: ShapeData[]
    ) {
        this.isMultiSelect = shapesToResize.length > 1
        this.originalShapes = shapesToResize.map(s => ({ ...s }))
        
        if (this.isMultiSelect) this.originalBoundingBox = getShapesBoundingBox(shapesToResize)
        
        this.context.changeState(CanvasStateEnum.RESIZING_OBJECT)
    }

    onMouseMove(coords: CanvasCoords, e: PointerEvent): void {
        this.applyResize(coords, false)
    }

    onMouseUp(coords: CanvasCoords, e: PointerEvent): void {
        this.applyResize(coords, true)
    }

    private applyResize(coords: CanvasCoords, saveToHistory: boolean) {
        if (this.isMultiSelect && this.originalBoundingBox) {
            const updates = getMultiResizeUpdates(this.originalShapes, this.originalBoundingBox, this.resizeHandle, coords)
            this.context.applyOperation(CanvasState.updateShapes(updates), saveToHistory)
        } else {
            const newDimensions = calculateRotatedResize(this.originalShapes[0], this.resizeHandle, coords)
            this.context.applyOperation(
                CanvasState.updateShape(this.originalShapes[0].id, newDimensions),
                saveToHistory,
                this.originalShapes[0]
            )
        }
    }
}
