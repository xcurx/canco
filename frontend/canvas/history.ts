import { Operation, ShapeData } from './type'
import { CanvasState } from './state'
import { computeInverse } from './operations'

export type HistoryCallbacks = {
    onHistoryChange: ({type, state}: {type: "undo" | "redo", state: CanvasState}) => void
}

export type HistorySnapshot = {canUndo: boolean, canRedo: boolean}

export class HistoryManager {
    private operationHistory: Operation[] = []
    private currentHistoryIndex = -1
    private maxHistorySize = 50
    private getCanvasState: () => CanvasState
    private callbacks: HistoryCallbacks
    private listners: Set<() => void> = new Set()
    private snapshot: HistorySnapshot = {canUndo: false, canRedo: false}

    constructor(getCanvasState: () => CanvasState, callbacks?: HistoryCallbacks) {
        this.getCanvasState = getCanvasState
        if (!callbacks) {
            this.callbacks = {
                onHistoryChange: () => {}
            }
        } else {
            this.callbacks = callbacks
        }
    }

    subscribe = (listner: () => void) => {
        this.listners.add(listner)
        return () => this.listners.delete(listner)
    }

    getSnapshot = (): HistorySnapshot => {
        return this.snapshot
    }

    private notifyChange() {
        const next: HistorySnapshot = {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        }
        // only update snapshot and notify if values actually changed
        if (next.canUndo !== this.snapshot.canUndo || next.canRedo !== this.snapshot.canRedo) {
            this.snapshot = next
            this.listners.forEach(listner => listner())
        }
    }

    addOperation(operation: Operation, originalShape?: ShapeData): void {
        operation.inverse = computeInverse(operation, this.getCanvasState(), originalShape)

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
        this.notifyChange()
    }

    undo(): boolean {
        if (this.currentHistoryIndex < 0) return false

        const operation = this.operationHistory[this.currentHistoryIndex]

        if (!operation.inverse) {
            console.log("No inverse for operation, cannot undo")
            return false
        }

        const state = CanvasState.applyOperation(this.getCanvasState(), operation.inverse)
        this.currentHistoryIndex--
        this.callbacks.onHistoryChange({
            type: "undo",
            state,
        })
        this.notifyChange()
        
        return true
    }

    redo(): boolean {
        if (this.currentHistoryIndex >= this.operationHistory.length - 1) return false

        this.currentHistoryIndex++
        const operation = this.operationHistory[this.currentHistoryIndex]
        
        const state = CanvasState.applyOperation(this.getCanvasState(), operation)
        this.callbacks.onHistoryChange({
            type: "redo",
            state,
        })
        this.notifyChange()
        
        return true
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

    setCallbacks(callbacks: HistoryCallbacks): void {
        this.callbacks = callbacks
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
}