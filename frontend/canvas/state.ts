import { 
    ShapeData, 
    Operation, 
    CreateShapeOperation, 
    UpdateShapeOperation, 
    DeleteShapeOperation,
    SelectShapeOperation,
    DeselectAllOperation,
    RectangleData,
    CircleData,
    TextData,
    MultiSelectOperation,
    UpdateShapesOperation,
    CreateShapesOperation,
    DeleteShapesOperation
} from './type'

export class CanvasState {
    private shapes: Map<string, ShapeData> = new Map()
    private selectedShapeId: string | null = null
    private selectedShapeIds: string[] = []
    public isMultiSelected = false

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
        if (!operation) return currentState

        console.log("Applying operation in CanvasState:", operation)

        switch (operation.type) {
            case 'CREATE_SHAPE': {
                const op = operation as CreateShapeOperation
                newShapes.set(op.data.shape.id, op.data.shape)
                break
            }
            case 'UPDATE_SHAPE': {
                const op = operation as UpdateShapeOperation
                const existing = newShapes.get(op.data.id)
                if (existing) newShapes.set(op.data.id, { ...existing, ...op.data.changes } as ShapeData)
                break
            }
            case 'DELETE_SHAPE': {
                const op = operation as DeleteShapeOperation
                newShapes.delete(op.data.id)
                break
            }
            case 'SELECT_SHAPE': {
                const op = operation as SelectShapeOperation
                newShapes.forEach((shape, id) => {
                    if (shape.isSelected) newShapes.set(id, { ...shape, isSelected: false })
                })
                const target = newShapes.get(op.data.id)
                if (target) newShapes.set(op.data.id, { ...target, isSelected: true })
                break
            }
            case 'MULTISELECT_SHAPES': {
                const op = operation as MultiSelectOperation
                const target = newShapes.get(op.data.id)
                if (target) newShapes.set(op.data.id, { ...target, isSelected: !target.isSelected })
                break
            }
            case 'DESELECT_ALL': {
                newShapes.forEach((shape, id) => {
                    if (shape.isSelected) newShapes.set(id, { ...shape, isSelected: false })
                })
                break
            }
            case 'UPDATE_SHAPES': {
                const op = operation as UpdateShapesOperation
                op.data.updates.forEach(({ id, changes }) => {
                    const existing = newShapes.get(id)
                    if (existing) newShapes.set(id, { ...existing, ...changes } as ShapeData)
                })
                break
            }
            case 'CREATE_SHAPES': {
                const op = operation as CreateShapesOperation
                op.data.shapes.forEach(shape => newShapes.set(shape.id, shape))
                break
            }
            case 'DELETE_SHAPES': {
                const op = operation as DeleteShapesOperation
                op.data.ids.forEach(id => newShapes.delete(id))
                break
            }
            default:
                throw new Error(`Unknown operation type: ${operation.type}`)
        }

        const newState = new CanvasState([])
        newState.shapes = newShapes
        const selectedShapes = Array.from(newShapes.values()).filter(s => s.isSelected)
        newState.selectedShapeIds = selectedShapes.map(s => s.id)
        newState.isMultiSelected = selectedShapes.length > 1
        newState.selectedShapeId = selectedShapes.length === 1 ? selectedShapes[0].id : null
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

    getSelectedShapes(): ShapeData[] {
        if (this.isMultiSelected) {
            return this.getAllShapes().filter((shape) => shape.isSelected)
        }
        return []
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

    static multiSelectShapes(id: string): MultiSelectOperation {
        return {
            id: crypto.randomUUID(),
            type: 'MULTISELECT_SHAPES',
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

    static updateShapes(updates: Array<{ id: string, changes: Partial<ShapeData> }>): UpdateShapesOperation {
        return {
            id: crypto.randomUUID(),
            type: 'UPDATE_SHAPES',
            timestamp: Date.now(),
            data: { updates }
        }
    }
    static createShapes(shapes: ShapeData[]): CreateShapesOperation {
        return {
            id: crypto.randomUUID(),
            type: 'CREATE_SHAPES',
            timestamp: Date.now(),
            data: { shapes }
        }
    }
    static deleteShapes(ids: string[]): DeleteShapesOperation {
        return {
            id: crypto.randomUUID(),
            type: 'DELETE_SHAPES',
            timestamp: Date.now(),
            data: { ids }
        }
    }
}

export function createLineData(x1: number, y1: number, x2: number, y2: number, color: string, r: number = 0): ShapeData {
    return {
        id: crypto.randomUUID(),
        type: 'line',
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        color,
        isSelected: true,
        zIndex: Date.now(),
        rotation: r,
    }
}

export function createRectangleData(x: number, y: number, width: number, height: number, color: string, r: number = 0, fillColor?: string): RectangleData {
    return {
        id: crypto.randomUUID(),
        type: 'rectangle',
        x,
        y,
        width,
        height,
        color,
        isSelected: true,
        zIndex: Date.now(),
        rotation: r,
        fillColor
    }
}

export function createCircleData(x: number, y: number, radiusX: number, radiusY: number, color: string, r: number = 0): CircleData {
    return {
        id: crypto.randomUUID(),
        type: 'circle',
        x,
        y,
        width: radiusX * 2,
        height: radiusY * 2,
        color,
        isSelected: true,
        zIndex: Date.now(),
        rotation: r
    }
}

export function createTextData(x: number, y: number, color: string, text: string, r: number = 0): TextData {
    return {
        id: crypto.randomUUID(),
        type: 'text',
        x,
        y,
        width: 20,
        height: 28.8,
        color,
        isSelected: false,
        zIndex: Date.now(),
        text,
        fontSize: 24,
        rotation: r
    }
}
