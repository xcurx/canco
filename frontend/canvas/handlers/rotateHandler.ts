import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData } from '../type'
import { CanvasState } from '../state'
import { getShapesBoundingBox, getMultiRotationUpdates, BoundingBox } from '../utils'

export class RotateHandler implements InteractionHandler {
    private originalShapes: ShapeData[]
    private originalBoundingBox: BoundingBox | null = null
    private initialRotationAngle: number = 0
    private isMultiSelect: boolean

    constructor(
        private context: InteractionContext,
        startCoords: CanvasCoords,
        shapesToRotate: ShapeData[]
    ) {
        this.isMultiSelect = shapesToRotate.length > 1
        this.originalShapes = shapesToRotate.map(s => ({ ...s }))
        
        if (this.isMultiSelect) {
            this.originalBoundingBox = getShapesBoundingBox(shapesToRotate)
            if (this.originalBoundingBox) {
                const boxCenterX = this.originalBoundingBox.x + this.originalBoundingBox.width / 2
                const boxCenterY = this.originalBoundingBox.y + this.originalBoundingBox.height / 2
                this.initialRotationAngle = Math.atan2(startCoords.y - boxCenterY, startCoords.x - boxCenterX) * (180 / Math.PI)
            }
        }
        
        this.context.changeState(CanvasStateEnum.ROTATING_OBJECT)
    }

    onMouseMove(coords: CanvasCoords, e: MouseEvent): void {
        this.applyRotation(coords, false)
    }

    onMouseUp(coords: CanvasCoords, e: MouseEvent): void {
        this.applyRotation(coords, true)
    }

    private applyRotation(coords: CanvasCoords, saveToHistory: boolean) {
        if (this.isMultiSelect && this.originalBoundingBox) {
            const updates = getMultiRotationUpdates(this.originalShapes, this.originalBoundingBox, this.initialRotationAngle, coords)
            this.context.applyOperation(CanvasState.updateShapes(updates), saveToHistory)
        } else {
            const original = this.originalShapes[0]
            const center = { x: original.x + original.width / 2, y: original.y + original.height / 2 }
            let angle = Math.atan2(coords.y - center.y, coords.x - center.x) * (180 / Math.PI)
            angle = (angle + 90) % 360
            this.context.applyOperation(
                CanvasState.updateShape(original.id, { rotation: angle }),
                saveToHistory,
                original
            )
        }
    }
}
