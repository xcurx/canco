import { CreateShapeOperation, DeleteShapeOperation, Operation, ShapeData, UpdateShapeOperation } from './type'
import { CanvasState } from './state'

export class HistoryManager {
    private operationHistory: Operation[] = []
    private currentHistoryIndex = -1
    private maxHistorySize = 50
    private getCanvasState: () => CanvasState

    constructor(getCanvasState: () => CanvasState) {
        this.getCanvasState = getCanvasState
    }

    addOperation(operation: Operation): void {
        operation.inverse = this.computeInverse(operation)

        // remove any operations after current index
        this.operationHistory = this.operationHistory.slice(0, this.currentHistoryIndex + 1)
        
        // add new operation
        this.operationHistory.push(operation)
        this.currentHistoryIndex++
        
        // limit history size
        if (this.operationHistory.length > this.maxHistorySize) {
            this.operationHistory.shift()
            this.currentHistoryIndex--
        }

        console.log("History index is",this.currentHistoryIndex)
    }

    undo(): { state: CanvasState; inverseOp: Operation } | null {
        if (this.currentHistoryIndex < 0) return null

        const operation = this.operationHistory[this.currentHistoryIndex]

        let state = new CanvasState()
        for (let i = 0; i < this.currentHistoryIndex; i++) {
            state = CanvasState.applyOperation(state, this.operationHistory[i])
        }
        this.currentHistoryIndex--
        
        return {
            state,
            inverseOp: operation.inverse!
        }
    }

    redo(): {state: CanvasState, operation: Operation} | null {
        if (this.currentHistoryIndex >= this.operationHistory.length - 1) return null

        this.currentHistoryIndex++
        const operation = this.operationHistory[this.currentHistoryIndex]
        
        let state = new CanvasState()
        for (let i = 0; i <= this.currentHistoryIndex; i++) {
            state = CanvasState.applyOperation(state, this.operationHistory[i])
        }

        return { state, operation }
    }

    getCurrentHistoryIndex(): number {
        return this.currentHistoryIndex
    }

    canUndo(): boolean {
        return this.currentHistoryIndex >= 0
    }

    canRedo(): boolean {
        return this.currentHistoryIndex < this.operationHistory.length - 1
    }

    clear(): void {
        this.operationHistory = []
        this.currentHistoryIndex = -1
        console.log("History cleared")
    }

    getHistoryInfo(): {totalOperations: number, currentIndex: number, canUndo: boolean, canRedo: boolean} {
        return {
            totalOperations: this.operationHistory.length,
            currentIndex: this.currentHistoryIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        }
    }

    private computeInverse(op: Operation): Operation {
        const state = this.getCanvasState()
        
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
                const currentShape = state.getShape(updateOp.data.id)
                if (!currentShape) {
                    // Fallback: return a no-op inverse
                    return op
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

            default: {
                return op
            }
        }
    }
}