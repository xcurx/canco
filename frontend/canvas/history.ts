import { Operation } from './type'
import { CanvasState } from './state'

export class HistoryManager {
    private operationHistory: Operation[] = []
    private currentHistoryIndex = -1
    private maxHistorySize = 50

    addToHistory(operation: Operation) {
        this.operationHistory = this.operationHistory.slice(0, this.currentHistoryIndex + 1)
        this.operationHistory.push(operation)
        if (this.operationHistory.length > this.maxHistorySize) {
            this.operationHistory.shift()
        } else {
            this.currentHistoryIndex++
        }
    }

    addOperation(operation: Operation): void {
        // Remove any operations after current index
        this.operationHistory = this.operationHistory.slice(0, this.currentHistoryIndex + 1)
        
        // Add new operation
        this.operationHistory.push(operation)
        this.currentHistoryIndex++
        
        // Limit history size
        if (this.operationHistory.length > this.maxHistorySize) {
            this.operationHistory.shift()
            this.currentHistoryIndex--
        }
    }

    undo(): CanvasState | null {
        if (this.currentHistoryIndex < 0) return null

        let state = new CanvasState()

        for (let i = 0; i < this.currentHistoryIndex; i++) {
            state = CanvasState.applyOperation(state, this.operationHistory[i])
        }
        
        this.currentHistoryIndex--
        return state
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
}