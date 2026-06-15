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
import { Camera } from './camera'

export type InteractionCallbacks = {
    onStateChange: (state: CanvasStateEnum) => void
    onApplyOperation: (operation: Operation, saveToHistory:boolean, originalShape?: ShapeData) => void
    onUpdateTempShape: (shape: ShapeData | null) => void
    onUndo: () => void
    onRedo: () => void
    onCameraChange: () => void
}

export class InteractionManager {
    private state: CanvasStateEnum = CanvasStateEnum.IDLE
    
    // Interaction state
    private dragOffset: {x: number, y: number} | null = null
    private resizeHandle: {x: number, y: number, type: string} | null = null
    private startPoint: {x: number, y: number} | null = null
    private tempShape: ShapeData | null = null
    private originalShape: ShapeData | null = null

    private lastPanPoint: {x: number, y: number} | null = null

    constructor(
        private canvas: HTMLCanvasElement,
        private callbacks: InteractionCallbacks,
        private getCanvasState: () => CanvasState,
        private toolManager: ToolManager,
        private camera: Camera
    ) {
        this.addEventListeners()
    }

    handleMouseDown(coords: CanvasCoords, e: MouseEvent): void {
        if (e.button == 2) {
            e.preventDefault()
            return
        }

        if (e.button == 1) {
            this.state = CanvasStateEnum.PANNING
        }

        if (this.state == CanvasStateEnum.PANNING) {
            this.lastPanPoint = {
                x: e.clientX,
                y: e.clientY
            }
            this.canvas.style.cursor = 'grabbing'
            return
        }

        this.startPoint = coords
        const canvasState = this.getCanvasState()
        
        // console.log("Mouse down", this.state, this.toolManager.getCurrentTool())

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

    handleMouseMove(coords: CanvasCoords, e: MouseEvent): void {
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

            case CanvasStateEnum.PANNING:
                this.handlePanMove(e);
                break

            case CanvasStateEnum.IDLE:
                break
        }
    }

    handleMouseUp(coords: CanvasCoords): void {
        switch (this.state) {
            case CanvasStateEnum.CREATING_SHAPE:
                this.finishCreateShape()
                break

            case CanvasStateEnum.MOVING_OBJECT:
                this.finishMoveShape(coords)
                break

            case CanvasStateEnum.RESIZING_OBJECT:
                this.finishResizeShape(coords)
                break
            
            case CanvasStateEnum.PANNING:
                this.finishPan()
                break
        }

        this.resetInteractionState()
    }

    handleWheel(e: WheelEvent): void {
        e.preventDefault()

        const rect = this.canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        // mouse pos in world spcce before zooming
        const worldBefore = this.camera.screenToWorld(mouseX, mouseY)
        
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
        this.camera.scale *= zoomFactor

        this.camera.scale = Math.max(0.1, Math.min(10, this.camera.scale))

        const worldAfter = this.camera.screenToWorld(mouseX, mouseY)
        
        this.camera.offsetX += (worldAfter.x - worldBefore.x)
        this.camera.offsetY += (worldAfter.y - worldBefore.y)

        this.callbacks.onCameraChange()
    }

    handleKeyDown(e: KeyboardEvent): void {
        // prevent default for all handled keys
        const handled = this.processKeyboardShortcut(e)
        if (handled) {
            e.preventDefault()
        }
    }

    handleKeyUp(e: KeyboardEvent): void {
        if (e.code === 'Space') {
            this.state = CanvasStateEnum.IDLE
            this.canvas.style.cursor = 'default'
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
        this.canvas.removeEventListener("wheel", this.onWheel)
        removeEventListener("keydown", this.onKeyDown)
        removeEventListener("keyup", this.onKeyUp)
    }

    private handleResizeHandleClick(coords: CanvasCoords, selectedShape: ShapeData): boolean {
        const clickedHandle = getClickedHandle(coords, selectedShape, this.camera.scale)
        if (clickedHandle) {
            this.state = CanvasStateEnum.RESIZING_OBJECT
            this.resizeHandle = clickedHandle
            this.originalShape = { ...selectedShape }
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
            this.originalShape = { ...selectedShape }
            this.callbacks.onStateChange(this.state)
            return true
        }
        return false
    }

    private handleShapeSelectionClick(coords: CanvasCoords, canvasState: CanvasState): boolean {
        const shapes = canvasState.getAllShapes()
        
        // check from top to bottom (reverse z-order)
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(coords, shapes[i])) {
                // select the shape
                this.callbacks.onApplyOperation(CanvasState.selectShape(shapes[i].id), true)
                
                // prepare for potential drag
                this.state = CanvasStateEnum.MOVING_OBJECT
                this.dragOffset = {
                    x: coords.x - shapes[i].x,
                    y: coords.y - shapes[i].y
                }
                this.originalShape = { ...shapes[i] }
                this.callbacks.onStateChange(this.state)
                return true
            }
        }
        return false
    }

    private handleEmptySpaceClick(coords: CanvasCoords): void {
        this.callbacks.onApplyOperation(CanvasState.deselectAll(), true)
        if (this.toolManager.hasActiveTool()) {
            this.startCreateShape(coords)
        } else {
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
            }), false)
        }
    }

    private handleResizeObjectMove(coords: CanvasCoords): void {
        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.resizeHandle) {
            const newDimensions = this.calculateResize(selectedShape, this.resizeHandle, coords)
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, newDimensions), false)
        }
    }

    private handlePanMove(e: MouseEvent): void {
        if (this.state == CanvasStateEnum.PANNING && this.lastPanPoint) {
            this.camera.offsetX += (e.clientX - this.lastPanPoint.x) / this.camera.scale
            this.camera.offsetY += (e.clientY - this.lastPanPoint.y) / this.camera.scale
            this.lastPanPoint = { x: e.clientX, y: e.clientY }
            this.callbacks.onCameraChange()
        }
    }

    private finishCreateShape(): void {
        if (this.tempShape && this.toolManager.isShapeViable(this.tempShape)) {
            this.callbacks.onApplyOperation(CanvasState.createShape(this.tempShape), true)
        }
    }

    private finishMoveShape(coords: CanvasCoords): void {
        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.dragOffset) {
            const newX = coords.x - this.dragOffset.x
            const newY = coords.y - this.dragOffset.y
            
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, {
                x: newX,
                y: newY
            }), true, this.originalShape ?? undefined)
        }
    }

    private finishResizeShape(coords: CanvasCoords): void {
        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.resizeHandle) {
            const newDimensions = this.calculateResize(selectedShape, this.resizeHandle, coords)
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, newDimensions), true, this.originalShape ?? undefined)
        }
    }

    private finishPan(): void {
        if (this.state == CanvasStateEnum.PANNING) {
            this.state = CanvasStateEnum.IDLE
            this.lastPanPoint = null
            this.canvas.style.cursor = 'default'
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
                this.callbacks.onApplyOperation(CanvasState.deleteShape(selectedShape.id), true)
                return true
            }
        }

        // Escape to clear tool selection
        if (e.key === 'Escape') {
            this.toolManager.clearTool()
            this.callbacks.onApplyOperation(CanvasState.deselectAll(), true)
            return true
        }

        if (e.code === 'Space') {
            this.state = CanvasStateEnum.PANNING
            this.canvas.style.cursor = 'grab'
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
        this.originalShape = null
        
        this.callbacks.onStateChange(this.state)
        this.callbacks.onUpdateTempShape(null)
    }

    private addEventListeners(): void {
        this.canvas.addEventListener("mousedown", this.onMouseDown)
        this.canvas.addEventListener("mousemove", this.onMouseMove)
        this.canvas.addEventListener("mouseup", this.onMouseUp)
        this.canvas.addEventListener("wheel", this.onWheel, { passive: false })
        addEventListener("keydown", this.onKeyDown)
        addEventListener("keyup", this.onKeyUp)
    }

    // event handler wrappers to maintain 'this' context
    private onMouseDown = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)
        this.handleMouseDown(coords, e)
    }

    private onMouseMove = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)
        this.handleMouseMove(coords, e)
    }

    private onMouseUp = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)
        this.handleMouseUp(coords)
    }

    private onKeyDown = (e: KeyboardEvent) => {
        this.handleKeyDown(e)
    }

    private onKeyUp = (e: KeyboardEvent) => {
        this.handleKeyUp(e)
    }

    private onWheel = (e: WheelEvent) => {
        e.preventDefault()
        this.handleWheel(e)
    }

    private getCanvasCoordinates(e: MouseEvent): CanvasCoords {
        const rect = this.canvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        return this.camera.screenToWorld(sx, sy)
    }
}