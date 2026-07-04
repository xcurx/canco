import { CanvasCoords, CanvasState as CanvasStateEnum, Operation, ShapeData } from '../type'
import { CanvasState } from '../state'
import { Camera } from '../camera'
import { ToolManager } from '../tools'

// the methods the handlers will access from the main Manager
export interface InteractionContext {
    getCanvasState(): CanvasState
    applyOperation(op: Operation, saveToHistory: boolean, originalShape?: ShapeData): void
    updateTempShape(shape: ShapeData | null): void
    changeState(state: CanvasStateEnum): void
    onCameraChange(): void
    onEditText?: (shape: ShapeData) => void
    camera: Camera
    toolManager: ToolManager
}

// every tool must implement this
export interface InteractionHandler {
    onMouseMove(coords: CanvasCoords, e: PointerEvent): void
    onMouseUp(coords: CanvasCoords, e: PointerEvent): void
    cleanup?(): void
}
