import {
    CreateShapeOperation,
    CreateShapesOperation,
    DeleteShapeOperation,
    DeleteShapesOperation,
    Operation,
    ShapeData,
    UpdateShapeOperation,
    UpdateShapesOperation
} from './type'
import { CanvasState } from './state'

export function computeInverse(op: Operation, state: CanvasState, originalShape?: ShapeData): Operation {
    switch (op.type) {
        case "CREATE_SHAPE": {
            const createOp = op as CreateShapeOperation
            return {
                id: crypto.randomUUID(),
                type: "DELETE_SHAPE",
                timestamp: Date.now(),
                data: { id: createOp.data.shape.id }
            }
        }

        case "DELETE_SHAPE": {
            const deleteOp = op as DeleteShapeOperation
            const deletedShape = state.getShape(deleteOp.data.id)
            return {
                id: crypto.randomUUID(),
                type: 'CREATE_SHAPE',
                timestamp: Date.now(),
                data: { shape: deletedShape }
            }
        }

        case 'UPDATE_SHAPE': {
            const updateOp = op as UpdateShapeOperation
            const currentShape = originalShape ?? state.getShape(updateOp.data.id)
            if (!currentShape) {
                // Fallback: return a no-op inverse
                return { ...op }
            }

            // Capture the current values for properties being changed
            const previousValues: Partial<ShapeData> = {}
            for (const key of Object.keys(updateOp.data.changes) as (keyof ShapeData)[]) {
                previousValues[key] = currentShape[key] as any
            }

            return {
                id: crypto.randomUUID(),
                type: 'UPDATE_SHAPE',
                timestamp: Date.now(),
                data: { id: updateOp.data.id, changes: previousValues }
            }
        }

        case 'SELECT_SHAPE': {
            const selectedShape = state.getSelectedShape()
            if (!selectedShape) {
                return {
                    id: crypto.randomUUID(),
                    type: 'DESELECT_ALL',
                    timestamp: Date.now(),
                    data: {}
                }
            }
            return {
                id: crypto.randomUUID(),
                type: 'SELECT_SHAPE',
                timestamp: Date.now(),
                data: { id: selectedShape.id }
            }
        }

        case 'DESELECT_ALL': {
            const selectedShape = state.getSelectedShape()
            if (!selectedShape) {
                return {
                    id: crypto.randomUUID(),
                    type: 'DESELECT_ALL',
                    timestamp: Date.now(),
                    data: {}
                }
            }
            return {
                id: crypto.randomUUID(),
                type: 'SELECT_SHAPE',
                timestamp: Date.now(),
                data: { id: selectedShape.id }
            }
        }

        case 'UPDATE_SHAPES': {
            const updateOp = op as UpdateShapesOperation
            const inverseUpdates = updateOp.data.updates.map(({ id, changes }) => {
                const currentShape = state.getShape(id)
                const previousValues: Partial<ShapeData> = {}
                if (currentShape) {
                    for (const key of Object.keys(changes) as (keyof ShapeData)[]) {
                        previousValues[key] = currentShape[key] as any
                    }
                }
                return { id, changes: previousValues }
            })
            return {
                id: crypto.randomUUID(),
                type: 'UPDATE_SHAPES',
                timestamp: Date.now(),
                data: { updates: inverseUpdates }
            }
        }

        case "CREATE_SHAPES": {
            const createOp = op as CreateShapesOperation
            return {
                id: crypto.randomUUID(),
                type: "DELETE_SHAPES",
                timestamp: Date.now(),
                data: { ids: createOp.data.shapes.map(s => s.id) }
            }
        }

        case "DELETE_SHAPES": {
            const deleteOp = op as DeleteShapesOperation
            const deletedShapes = deleteOp.data.ids
                .map(id => state.getShape(id))
                .filter((s): s is ShapeData => s !== undefined)
            return {
                id: crypto.randomUUID(),
                type: 'CREATE_SHAPES',
                timestamp: Date.now(),
                data: { shapes: deletedShapes }
            }
        }

        default: {
            return { ...op }
        }
    }
}
