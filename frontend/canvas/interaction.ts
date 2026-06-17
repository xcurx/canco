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
import { ShortcutManager } from './shortcuts'
import { calculateResize } from './utils'

export type InteractionCallbacks = {
    onStateChange: (state: CanvasStateEnum) => void
    onApplyOperation: (operation: Operation, saveToHistory:boolean, originalShape?: ShapeData) => void
    onUpdateTempShape: (shape: ShapeData | null) => void
    onUndo: () => void
    onRedo: () => void
    onCameraChange: () => void
    onEditText?: (shape: ShapeData) => void
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

    private shortcutManager: ShortcutManager

    constructor(
        private canvas: HTMLCanvasElement,
        private callbacks: InteractionCallbacks,
        private getCanvasState: () => CanvasState,
        private toolManager: ToolManager,
        private camera: Camera
    ) {
        this.addEventListeners()

        this.shortcutManager = new ShortcutManager({
            onUndo: () => this.callbacks.onUndo(),
            onRedo: () => this.callbacks.onRedo(),
            onDelete: () => {
                const selectedShape = this.getCanvasState().getSelectedShape()
                if (selectedShape) {
                    this.callbacks.onApplyOperation(CanvasState.deleteShape(selectedShape.id), true)
                }
            },
            onEscape: () => {
                this.toolManager.clearTool()
                this.callbacks.onApplyOperation(CanvasState.deselectAll(), true)
            },
            onSpaceDown: () => {
                this.state = CanvasStateEnum.PANNING
                this.canvas.style.cursor = 'grab'
            },
            onSpaceUp: () => {
                this.state = CanvasStateEnum.IDLE
                this.canvas.style.cursor = 'default'
            }
        })
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
        this.canvas.removeEventListener("dblclick", this.onDoubleClick)
        this.shortcutManager.cleanup()
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
            const newDimensions = calculateResize(selectedShape, this.resizeHandle, coords)
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

            if (this.tempShape.type === 'text') {
                this.callbacks.onEditText?.(this.tempShape)
                this.toolManager.clearTool()
                this.callbacks.onApplyOperation(CanvasState.selectShape(this.tempShape.id), false)
            }
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
            const newDimensions = calculateResize(selectedShape, this.resizeHandle, coords)
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
        this.canvas.addEventListener("dblclick", this.onDoubleClick)
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

    private onWheel = (e: WheelEvent) => {
        e.preventDefault()
        this.handleWheel(e)
    }

    private onDoubleClick = (e: MouseEvent) => {
        if (this.state !== CanvasStateEnum.IDLE) return
        const coords = this.getCanvasCoordinates(e)
        const shapes = this.getCanvasState().getAllShapes()

        for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].type === 'text' && isPointInShape(coords, shapes[i])) {
                this.callbacks.onEditText?.(shapes[i])
                break
            }
        }

    }

    private getCanvasCoordinates(e: MouseEvent): CanvasCoords {
        const rect = this.canvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        return this.camera.screenToWorld(sx, sy)
    }
}