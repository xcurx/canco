import { 
    ShapeData, 
    Operation, 
    CreateShapeOperation, 
    UpdateShapeOperation, 
    DeleteShapeOperation,
    SelectShapeOperation,
    DeselectAllOperation,
    RectangleData,
    CircleData
} from './type'

export class CanvasState {
    private shapes: Map<string, ShapeData> = new Map()
    private selectedShapeId: string | null = null

    constructor(initialShapes?: ShapeData[]) {
        initialShapes?.forEach(shape => {
            this.shapes.set(shape.id, shape)
            if (shape.isSelected) {
                this.selectedShapeId = shape.id
            }
        })
    }

    static applyOperation(currentState: CanvasState, operation: Operation): CanvasState {
        const newShapes = new Map(currentState.shapes)
        let newSelectId = currentState.selectedShapeId
        if (!operation) return currentState
        console.log("Applying operation in CanvasState:", operation)

        switch (operation.type) {
            case 'CREATE_SHAPE': {
                const createOp = operation as CreateShapeOperation
                newShapes.set(createOp.data.shape.id, createOp.data.shape)
                if (createOp.data.shape.isSelected) {
                    newSelectId = createOp.data.shape.id
                }
                break
            }

            case 'UPDATE_SHAPE': {
                const updateOp = operation as UpdateShapeOperation
                const existingShape = newShapes.get(updateOp.data.id)
                if (existingShape) {
                    const updatedShape = { ...existingShape, ...updateOp.data.changes }
                    newShapes.set(updateOp.data.id, updatedShape)
                    if (updatedShape.isSelected) {
                        newSelectId = updateOp.data.id
                    } else if (newSelectId === updateOp.data.id) {
                        newSelectId = null
                    }
                }
                break
            }

            case 'DELETE_SHAPE': {
                const deleteOp = operation as DeleteShapeOperation
                newShapes.delete(deleteOp.data.id)
                if (newSelectId === deleteOp.data.id) {
                    newSelectId = null
                }
                break
            }

            case 'SELECT_SHAPE': {
                const selectOp = operation as SelectShapeOperation
                
                newShapes.forEach((shape, id) => {
                    if (shape.isSelected) {
                        newShapes.set(id, { ...shape, isSelected: false })
                    }
                })

                const targetShape = newShapes.get(selectOp.data.id)
                if (targetShape) {
                    newShapes.set(selectOp.data.id, { ...targetShape, isSelected: true })
                    newSelectId = selectOp.data.id
                }
                break
            }

            case 'DESELECT_ALL': {
                newShapes.forEach((shape, id) => {
                    if (shape.isSelected) {
                        newShapes.set(id, { ...shape, isSelected: false })
                    }
                })
                newSelectId = null
                break
            }

            default:
                throw new Error(`Unknown operation type: ${operation.type}`)
        }

        const newState = new CanvasState([])
        newState.shapes = newShapes
        newState.selectedShapeId = newSelectId
        return newState
    }

    getAllShapes(): ShapeData[] {
        return Array.from(this.shapes.values())
    }

    getShape(id: string): ShapeData | undefined {
        return this.shapes.get(id)
    }

    getSelectedShape(): ShapeData | null {
        if (this.selectedShapeId) {
            return this.shapes.get(this.selectedShapeId) || null
        }
        return null
    }

    hasShapes(): boolean {
        return this.shapes.size > 0
    }

    static createShape(shapeData: ShapeData): CreateShapeOperation {
        return {
            id: crypto.randomUUID(),
            type: 'CREATE_SHAPE',
            timestamp: Date.now(),
            data: { shape: shapeData }
        }
    }

    static updateShape(id: string, changes: Partial<ShapeData>): UpdateShapeOperation {
        return {
            id: crypto.randomUUID(),
            type: 'UPDATE_SHAPE',
            timestamp: Date.now(),
            data: { id, changes }
        }
    }

    static deleteShape(id: string): DeleteShapeOperation {
        return {
            id: crypto.randomUUID(),
            type: 'DELETE_SHAPE',
            timestamp: Date.now(),
            data: { id }
        }
    }

    static selectShape(id: string): SelectShapeOperation {
        return {
            id: crypto.randomUUID(),
            type: 'SELECT_SHAPE',
            timestamp: Date.now(),
            data: { id }
        }
    }

    static deselectAll(): DeselectAllOperation {
        return {
            id: crypto.randomUUID(),
            type: 'DESELECT_ALL',
            timestamp: Date.now(),
            data: {}
        }
    }
}

export function createLineData(x1: number, y1: number, x2: number, y2: number, color: string): ShapeData {
    return {
        id: crypto.randomUUID(),
        type: 'line',
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        color,
        isSelected: true,
        zIndex: Date.now()
    }
}

export function createRectangleData(x: number, y: number, width: number, height: number, color: string): RectangleData {
    return {
        id: crypto.randomUUID(),
        type: 'rectangle',
        x,
        y,
        width,
        height,
        color,
        isSelected: true,
        zIndex: Date.now()
    }
}

export function createCircleData(x: number, y: number, radiusX: number, radiusY: number, color: string): CircleData {
    return {
        id: crypto.randomUUID(),
        type: 'circle',
        x,
        y,
        width: radiusX * 2,
        height: radiusY * 2,
        color,
        isSelected: true,
        zIndex: Date.now()
    }
}