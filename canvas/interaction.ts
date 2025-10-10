import { 
    CanvasCoords, 
    CanvasState as CanvasStateEnum, 
    ShapeData,
    Operation 
} from './type'
import { CanvasState } from './state'
import { 
    getClickedHandle, 
    isPointInShape, 
    isPointInShapeInterior 
} from './selection'
import { ToolManager } from './tools'

export type InteractionCallbacks = {
    onStateChange: (state: CanvasStateEnum) => void
    onApplyOperation: (operation: Operation) => void
    onUpdateTempShape: (shape: ShapeData | null) => void
    onUndo: () => void
    onRedo: () => void
}

export class InteractionManager {
     private state: CanvasStateEnum = CanvasStateEnum.IDLE
    
    // Interaction state
    private dragOffset: {x: number, y: number} | null = null
    private resizeHandle: {x: number, y: number, type: string} | null = null
    private startPoint: {x: number, y: number} | null = null
    private tempShape: ShapeData | null = null

    constructor(
        private canvas: HTMLCanvasElement,
        private callbacks: InteractionCallbacks,
        private getCanvasState: () => CanvasState,
        private toolManager: ToolManager
    ) {
        this.addEventListeners()
    }

    handleMouseDown(coords: CanvasCoords): void {
        this.startPoint = coords
        const canvasState = this.getCanvasState()
        
        console.log("Mouse down", this.state, this.toolManager.getCurrentTool())

        // Priority 1: Check for handle clicks on selected shape (highest priority)
        const selectedShape = canvasState.getSelectedShape()
        if (selectedShape && this.handleResizeHandleClick(coords, selectedShape)) {
            return
        }

        // Priority 2: Check for clicks inside selected shape (for moving)
        if (selectedShape && this.handleSelectedShapeClick(coords, selectedShape)) {
            return
        }

        // Priority 3: Check for clicks on any shape (for selection)
        if (this.handleShapeSelectionClick(coords, canvasState)) {
            return
        }

        // Priority 4: Handle empty space clicks
        this.handleEmptySpaceClick(coords)
    }

    handleMouseMove(coords: CanvasCoords): void {
        switch (this.state) {
            case CanvasStateEnum.CREATING_SHAPE:
                this.handleCreateShapeMove(coords)
                break

            case CanvasStateEnum.MOVING_OBJECT:
                this.handleMoveObjectMove(coords)
                break

            case CanvasStateEnum.RESIZING_OBJECT:
                this.handleResizeObjectMove(coords)
                break

            case CanvasStateEnum.IDLE:
                // Could add hover effects here in the future
                break
        }
    }

    handleMouseUp(): void {
        switch (this.state) {
            case CanvasStateEnum.CREATING_SHAPE:
                this.finishCreateShape()
                break

            case CanvasStateEnum.MOVING_OBJECT:
            case CanvasStateEnum.RESIZING_OBJECT:
                // Operations were applied during mouse move, just reset state
                break
        }

        this.resetInteractionState()
    }

    handleKeyDown(e: KeyboardEvent): void {
        // prevent default for all handled keys
        const handled = this.processKeyboardShortcut(e)
        if (handled) {
            e.preventDefault()
        }
    }

    getState(): CanvasStateEnum {
        return this.state
    }

    getTempShape(): ShapeData | null {
        return this.tempShape
    }

    cleanup(): void {
        this.canvas.removeEventListener("mousedown", this.onMouseDown)
        this.canvas.removeEventListener("mousemove", this.onMouseMove)
        this.canvas.removeEventListener("mouseup", this.onMouseUp)
        removeEventListener("keydown", this.onKeyDown)
    }

    private handleResizeHandleClick(coords: CanvasCoords, selectedShape: ShapeData): boolean {
        const clickedHandle = getClickedHandle(coords, selectedShape)
        if (clickedHandle) {
            this.state = CanvasStateEnum.RESIZING_OBJECT
            this.resizeHandle = clickedHandle
            this.callbacks.onStateChange(this.state)
            return true
        }
        return false
    }

    private handleSelectedShapeClick(coords: CanvasCoords, selectedShape: ShapeData): boolean {
        if (isPointInShapeInterior(coords, selectedShape)) {
            this.state = CanvasStateEnum.MOVING_OBJECT
            this.dragOffset = {
                x: coords.x - selectedShape.x,
                y: coords.y - selectedShape.y
            }
            this.callbacks.onStateChange(this.state)
            return true
        }
        return false
    }

    private handleShapeSelectionClick(coords: CanvasCoords, canvasState: CanvasState): boolean {
        const shapes = canvasState.getAllShapes()
        
        // Check from top to bottom (reverse z-order)
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(coords, shapes[i])) {
                // Select the shape
                this.callbacks.onApplyOperation(CanvasState.selectShape(shapes[i].id))
                
                // Prepare for potential drag
                this.state = CanvasStateEnum.MOVING_OBJECT
                this.dragOffset = {
                    x: coords.x - shapes[i].x,
                    y: coords.y - shapes[i].y
                }
                this.callbacks.onStateChange(this.state)
                return true
            }
        }
        return false
    }

    private handleEmptySpaceClick(coords: CanvasCoords): void {
        this.callbacks.onApplyOperation(CanvasState.deselectAll())
        if (this.toolManager.hasActiveTool()) {
            // Start creating new shape
            this.startCreateShape(coords)
        } else {
            // Deselect all shapes
            this.state = CanvasStateEnum.IDLE
            this.callbacks.onStateChange(this.state)
        }
    }

    private startCreateShape(coords: CanvasCoords): void {
        const newShape = this.toolManager.createShape(coords)
        if (newShape) {
            this.state = CanvasStateEnum.CREATING_SHAPE
            this.tempShape = newShape
            this.callbacks.onStateChange(this.state)
            this.callbacks.onUpdateTempShape(this.tempShape)
        }
    }

    private handleCreateShapeMove(coords: CanvasCoords): void {
        if (this.tempShape && this.startPoint) {
            this.tempShape = this.toolManager.updateTempShape(
                this.tempShape,
                this.startPoint,
                coords
            )
            this.callbacks.onUpdateTempShape(this.tempShape)
        }
    }

    private handleMoveObjectMove(coords: CanvasCoords): void {
        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.dragOffset) {
            const newX = coords.x - this.dragOffset.x
            const newY = coords.y - this.dragOffset.y
            
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, {
                x: newX,
                y: newY
            }))
        }
    }

    private handleResizeObjectMove(coords: CanvasCoords): void {
        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.resizeHandle) {
            const newDimensions = this.calculateResize(selectedShape, this.resizeHandle, coords)
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, newDimensions))
        }
    }

    private finishCreateShape(): void {
        if (this.tempShape && this.toolManager.isShapeViable(this.tempShape)) {
            this.callbacks.onApplyOperation(CanvasState.createShape(this.tempShape))
        }
    }

    private calculateResize(
        shape: ShapeData, 
        handle: {type: string}, 
        coords: CanvasCoords
    ): Partial<ShapeData> {
        const newDimensions: Partial<ShapeData> = {}

        switch (handle.type) {
            case 'top-left':
                newDimensions.width = (shape.x + shape.width) - coords.x
                newDimensions.height = (shape.y + shape.height) - coords.y
                newDimensions.x = coords.x
                newDimensions.y = coords.y
                break

            case 'top-right':
                newDimensions.width = coords.x - shape.x
                newDimensions.height = (shape.y + shape.height) - coords.y
                newDimensions.y = coords.y
                break

            case 'bottom-right':
                newDimensions.width = coords.x - shape.x
                newDimensions.height = coords.y - shape.y
                break

            case 'bottom-left':
                newDimensions.width = (shape.x + shape.width) - coords.x
                newDimensions.height = coords.y - shape.y
                newDimensions.x = coords.x
                break

            case 'top-middle':
                newDimensions.height = (shape.y + shape.height) - coords.y
                newDimensions.y = coords.y
                break

            case 'bottom-middle':
                newDimensions.height = coords.y - shape.y
                break

            case 'middle-left':
                newDimensions.width = (shape.x + shape.width) - coords.x
                newDimensions.x = coords.x
                break

            case 'middle-right':
                newDimensions.width = coords.x - shape.x
                break
            case 'start':
                newDimensions.x = coords.x
                newDimensions.y = coords.y
                newDimensions.width = (shape.x + shape.width) - coords.x
                newDimensions.height = (shape.y + shape.height) - coords.y
                break
            case 'end':
                newDimensions.width = coords.x - shape.x
                newDimensions.height = coords.y - shape.y
                break
        }

        // Ensure minimum size
        if (shape.type !== "line" && newDimensions.width !== undefined) {
            newDimensions.width = Math.max(newDimensions.width, 15)
        }

        if (shape.type !== "line" && newDimensions.height !== undefined) {
            newDimensions.height = Math.max(newDimensions.height, 15)
        }

        return newDimensions
    }

    private processKeyboardShortcut(e: KeyboardEvent): boolean {
        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            this.callbacks.onUndo()
            return true
        }
        
        // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
        if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
            (e.ctrlKey && e.key === 'y')) {
            this.callbacks.onRedo()
            return true
        }
        
        // Delete key to delete selected shape
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedShape = this.getCanvasState().getSelectedShape()
            if (selectedShape) {
                this.callbacks.onApplyOperation(CanvasState.deleteShape(selectedShape.id))
                return true
            }
        }

        // Escape to clear tool selection
        if (e.key === 'Escape') {
            this.toolManager.clearTool()
            this.callbacks.onApplyOperation(CanvasState.deselectAll())
            return true
        }

        return false
    }

    private resetInteractionState(): void {
        this.state = CanvasStateEnum.IDLE
        this.dragOffset = null
        this.resizeHandle = null
        this.startPoint = null
        this.tempShape = null
        
        this.callbacks.onStateChange(this.state)
        this.callbacks.onUpdateTempShape(null)
    }

    private addEventListeners(): void {
        this.canvas.addEventListener("mousedown", this.onMouseDown)
        this.canvas.addEventListener("mousemove", this.onMouseMove)
        this.canvas.addEventListener("mouseup", this.onMouseUp)
        addEventListener("keydown", this.onKeyDown)
    }

    // Event handler wrappers to maintain 'this' context
    private onMouseDown = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)
        this.handleMouseDown(coords)
    }

    private onMouseMove = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)
        this.handleMouseMove(coords)
    }

    private onMouseUp = () => {
        this.handleMouseUp()
    }

    private onKeyDown = (e: KeyboardEvent) => {
        this.handleKeyDown(e)
    }

    private getCanvasCoordinates(e: MouseEvent): CanvasCoords {
        const rect = this.canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }
}