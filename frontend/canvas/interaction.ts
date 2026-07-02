import { 
    CanvasCoords, 
    CanvasState as CanvasStateEnum, 
    ShapeData,
    Operation 
} from './type'
import { CanvasState } from './state'
import { 
    getClickedHandle, 
    getResizehandlesFromCoords, 
    isPointInHandle, 
    isPointInShape, 
    isPointInShapeInterior 
} from './selection'
import { ToolManager } from './tools'
import { Camera } from './camera'
import { ShortcutManager } from './shortcuts'
import { calculateRotatedResize } from './utils'

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
    private originalShapes: ShapeData[] = []
    private originalBoundingBox: {x: number, y: number, width: number, height: number} | null = null
    private initialRotationAngle: number = 0

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
                const canvasState = this.getCanvasState()
                if (canvasState.isMultiSelected) {
                    const selectedShapes = canvasState.getSelectedShapes()
                    if (selectedShapes.length > 0) {
                        this.callbacks.onApplyOperation(CanvasState.deleteShapes(selectedShapes.map(s => s.id)), true)
                    }
                } else {
                    const selectedShape = canvasState.getSelectedShape()
                    if (selectedShape) {
                        this.callbacks.onApplyOperation(CanvasState.deleteShape(selectedShape.id), true)
                    }
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
        
        if (canvasState.isMultiSelected && this.handleMultiSelect(coords, canvasState)) {
            return
        }

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

            case CanvasStateEnum.ROTATING_OBJECT:
                this.handleShapeRotationMove(coords)
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

            case CanvasStateEnum.ROTATING_OBJECT:
                this.finishRotateShape(coords)
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

    private handleMultiSelect(coords: CanvasCoords, canvasState: CanvasState) {
        const selectedShapes = canvasState.getSelectedShapes()
        if (selectedShapes.length === 0) return false
        const minX = Math.min(...selectedShapes.map(s => s.x))
        const minY = Math.min(...selectedShapes.map(s => s.y))
        const maxX = Math.max(...selectedShapes.map(s => s.x + s.width))
        const maxY = Math.max(...selectedShapes.map(s => s.y + s.height))
        const boxCenterX = minX + (maxX - minX) / 2
        const boxCenterY = minY + (maxY - minY) / 2
        // check if clicked a handle of the multi-selection bounding box
        const handles = getResizehandlesFromCoords(minX, minY, maxX, maxY, this.camera.scale)
        for (const handle of handles) {
            if (isPointInHandle(coords, handle, this.camera.scale)) {
                this.originalShapes = selectedShapes.map(s => ({ ...s }))
                this.originalBoundingBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
                
                if (handle.type === 'rotation') {
                    this.state = CanvasStateEnum.ROTATING_OBJECT
                    this.resizeHandle = handle
                    // calculate the starting angle from the center of the bounding box to the cursor
                    this.initialRotationAngle = Math.atan2(coords.y - boxCenterY, coords.x - boxCenterX) * (180 / Math.PI)
                    this.callbacks.onStateChange(this.state)
                } else {
                    this.state = CanvasStateEnum.RESIZING_OBJECT
                    this.resizeHandle = handle
                    this.callbacks.onStateChange(this.state)
                }
                return true
            }
        }
        // check if clicked inside the bounding box to move
        if (coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY) {
            this.state = CanvasStateEnum.MOVING_OBJECT
            this.dragOffset = { x: coords.x, y: coords.y }
            this.originalShapes = selectedShapes.map(s => ({ ...s }))
            this.callbacks.onStateChange(this.state)
            return true
        }
        return false
    }

    private handleResizeHandleClick(coords: CanvasCoords, selectedShape: ShapeData): boolean {
        const clickedHandle = getClickedHandle(coords, selectedShape, this.camera.scale)
        if (clickedHandle && clickedHandle.type == "rotation") {
            this.state = CanvasStateEnum.ROTATING_OBJECT
            this.resizeHandle = clickedHandle
            this.originalShape = { ...selectedShape }
            this.callbacks.onStateChange(this.state)
            return true
        } else if (clickedHandle) {
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
        const isShiftPressed = this.shortcutManager.getPressedKey() == "Shift"
        
        // check from top to bottom (reverse z-order)
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(coords, shapes[i])) {
                // select the shape
                if (canvasState.isMultiSelected) {
                    if (shapes[i].isSelected && !isShiftPressed) {
                        this.callbacks.onApplyOperation(CanvasState.deselectAll(), true)
                    } else {
                        this.callbacks.onApplyOperation(CanvasState.multiSelectShapes(shapes[i].id), true)
                    }
                } else {
                    if (shapes[i].isSelected) {
                        this.callbacks.onApplyOperation(CanvasState.selectShape(shapes[i].id), true)
                    } else {
                        this.callbacks.onApplyOperation(CanvasState.multiSelectShapes(shapes[i].id), true)
                    }
                }
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
        const canvasState = this.getCanvasState()
        if (canvasState.isMultiSelected && this.dragOffset && this.originalShapes.length > 0) {
            const dx = coords.x - this.dragOffset.x
            const dy = coords.y - this.dragOffset.y
            const updates = this.originalShapes.map(original => ({
                id: original.id,
                changes: {
                    x: original.x + dx,
                    y: original.y + dy
                }
            }))
            this.callbacks.onApplyOperation(CanvasState.updateShapes(updates), false)
            return
        }
        const selectedShape = canvasState.getSelectedShape()
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
        const canvasState = this.getCanvasState()
        if (canvasState.isMultiSelected && this.resizeHandle && this.originalShapes.length > 0 && this.originalBoundingBox) {
            const dummyBox: ShapeData = {
                id: 'dummy',
                type: 'rectangle',
                x: this.originalBoundingBox.x,
                y: this.originalBoundingBox.y,
                width: this.originalBoundingBox.width,
                height: this.originalBoundingBox.height,
                color: '',
                isSelected: false,
                zIndex: 0,
                rotation: 0
            }
            
            const newBoxDimensions = calculateRotatedResize(dummyBox, this.resizeHandle, coords)
            
            // fallback to original dimensions if dimension is undefined (for single axis)
            const boxX = newBoxDimensions.x !== undefined ? newBoxDimensions.x : this.originalBoundingBox.x
            const boxY = newBoxDimensions.y !== undefined ? newBoxDimensions.y : this.originalBoundingBox.y
            const boxW = newBoxDimensions.width !== undefined ? newBoxDimensions.width : this.originalBoundingBox.width
            const boxH = newBoxDimensions.height !== undefined ? newBoxDimensions.height : this.originalBoundingBox.height
            const sx = boxW / this.originalBoundingBox.width
            const sy = boxH / this.originalBoundingBox.height
            const updates = this.originalShapes.map(original => {
                const relativeX = original.x - this.originalBoundingBox!.x
                const relativeY = original.y - this.originalBoundingBox!.y
                return {
                    id: original.id,
                    changes: {
                        x: boxX + relativeX * sx,
                        y: boxY + relativeY * sy,
                        width: original.width * sx,
                        height: original.height * sy
                    }
                }
            })
            this.callbacks.onApplyOperation(CanvasState.updateShapes(updates), false)
            return
        }

        const selectedShape = canvasState.getSelectedShape()
        if (selectedShape && this.resizeHandle && this.originalShape) {
            const newDimensions = calculateRotatedResize(this.originalShape, this.resizeHandle, coords)
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, newDimensions), false)
        }
    }

    private handleShapeRotationMove(coords: CanvasCoords): void {
        const canvasState = this.getCanvasState()
        if (canvasState.isMultiSelected && this.originalShapes.length > 0 && this.originalBoundingBox) {
            const boxCenterX = this.originalBoundingBox.x + this.originalBoundingBox.width / 2
            const boxCenterY = this.originalBoundingBox.y + this.originalBoundingBox.height / 2
            
            const currentAngle = Math.atan2(coords.y - boxCenterY, coords.x - boxCenterX) * (180 / Math.PI)
            const deltaAngle = currentAngle - this.initialRotationAngle
            const rad = (deltaAngle * Math.PI) / 180
            const updates = this.originalShapes.map(original => {
                const origCenterX = original.x + original.width / 2
                const origCenterY = original.y + original.height / 2
                
                // vector from group center to shape center
                const dx = origCenterX - boxCenterX
                const dy = origCenterY - boxCenterY
                
                // rotate center coordinate around group center
                const rotatedCenterX = boxCenterX + dx * Math.cos(rad) - dy * Math.sin(rad)
                const rotatedCenterY = boxCenterY + dx * Math.sin(rad) + dy * Math.cos(rad)
                
                return {
                    id: original.id,
                    changes: {
                        x: rotatedCenterX - original.width / 2,
                        y: rotatedCenterY - original.height / 2,
                        rotation: (original.rotation + deltaAngle) % 360
                    }
                }
            })
            this.callbacks.onApplyOperation(CanvasState.updateShapes(updates), false)
            return
        }

        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.resizeHandle && this.originalShape) {
            const center = {
                x: this.originalShape.x + this.originalShape.width / 2,
                y: this.originalShape.y + this.originalShape.height / 2
            }
            // angle between center and cursor
            let angle = Math.atan2(coords.y - center.y, coords.x - center.x) * (180 / Math.PI)
            // 90 degree offset because handle is at top
            angle = (angle + 90) % 360;
            const changes = { rotation: angle };
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, changes), false)
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
        const canvasState = this.getCanvasState()
        if (canvasState.isMultiSelected && this.dragOffset && this.originalShapes.length > 0) {
            const dx = coords.x - this.dragOffset.x
            const dy = coords.y - this.dragOffset.y
            const updates = this.originalShapes.map(original => ({
                id: original.id,
                changes: {
                    x: original.x + dx,
                    y: original.y + dy
                }
            }))
            this.callbacks.onApplyOperation(CanvasState.updateShapes(updates), true)
            return
        }
        const selectedShape = canvasState.getSelectedShape()
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
        const canvasState = this.getCanvasState()
        if (canvasState.isMultiSelected && this.resizeHandle && this.originalShapes.length > 0 && this.originalBoundingBox) {
            const dummyBox: ShapeData = {
                id: 'dummy',
                type: 'rectangle',
                x: this.originalBoundingBox.x,
                y: this.originalBoundingBox.y,
                width: this.originalBoundingBox.width,
                height: this.originalBoundingBox.height,
                color: '',
                isSelected: false,
                zIndex: 0,
                rotation: 0
            }
            
            const newBoxDimensions = calculateRotatedResize(dummyBox, this.resizeHandle, coords)
            
            // fallback to original dimensions if dimension is undefined (for single axis)
            const boxX = newBoxDimensions.x !== undefined ? newBoxDimensions.x : this.originalBoundingBox.x
            const boxY = newBoxDimensions.y !== undefined ? newBoxDimensions.y : this.originalBoundingBox.y
            const boxW = newBoxDimensions.width !== undefined ? newBoxDimensions.width : this.originalBoundingBox.width
            const boxH = newBoxDimensions.height !== undefined ? newBoxDimensions.height : this.originalBoundingBox.height
            
            const sx = boxW / this.originalBoundingBox.width
            const sy = boxH / this.originalBoundingBox.height
            
            const updates = this.originalShapes.map(original => {
                const relativeX = original.x - this.originalBoundingBox!.x
                const relativeY = original.y - this.originalBoundingBox!.y
                return {
                    id: original.id,
                    changes: {
                        x: boxX + relativeX * sx,
                        y: boxY + relativeY * sy,
                        width: original.width * sx,
                        height: original.height * sy
                    }
                }
            })
            this.callbacks.onApplyOperation(CanvasState.updateShapes(updates), true)
            return
        }

        const selectedShape = canvasState.getSelectedShape()
        if (selectedShape && this.resizeHandle && this.originalShape) {
            const newDimensions = calculateRotatedResize(this.originalShape, this.resizeHandle, coords)
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, newDimensions), true, this.originalShape ?? undefined)
        }
    }

    private finishRotateShape(coords: CanvasCoords): void {
        const canvasState = this.getCanvasState()
        
        if (canvasState.isMultiSelected && this.originalShapes.length > 0 && this.originalBoundingBox) {
            const boxCenterX = this.originalBoundingBox.x + this.originalBoundingBox.width / 2
            const boxCenterY = this.originalBoundingBox.y + this.originalBoundingBox.height / 2
            
            const currentAngle = Math.atan2(coords.y - boxCenterY, coords.x - boxCenterX) * (180 / Math.PI)
            const deltaAngle = currentAngle - this.initialRotationAngle
            const rad = (deltaAngle * Math.PI) / 180
            const updates = this.originalShapes.map(original => {
                const origCenterX = original.x + original.width / 2
                const origCenterY = original.y + original.height / 2
                
                const dx = origCenterX - boxCenterX
                const dy = origCenterY - boxCenterY
                
                const rotatedCenterX = boxCenterX + dx * Math.cos(rad) - dy * Math.sin(rad)
                const rotatedCenterY = boxCenterY + dx * Math.sin(rad) + dy * Math.cos(rad)
                
                return {
                    id: original.id,
                    changes: {
                        x: rotatedCenterX - original.width / 2,
                        y: rotatedCenterY - original.height / 2,
                        rotation: (original.rotation + deltaAngle) % 360
                    }
                }
            })
            this.callbacks.onApplyOperation(CanvasState.updateShapes(updates), true)
            return
        }

        const selectedShape = this.getCanvasState().getSelectedShape()
        if (selectedShape && this.resizeHandle && this.originalShape) {
            const center = {
                x: this.originalShape.x + this.originalShape.width / 2,
                y: this.originalShape.y + this.originalShape.height / 2
            }
            // angle between center and cursor
            let angle = Math.atan2(coords.y - center.y, coords.x - center.x) * (180 / Math.PI)
            // 90 degree offset because handle is at top
            angle = (angle + 90) % 360;
            this.callbacks.onApplyOperation(CanvasState.updateShape(selectedShape.id, { rotation: angle }), true, this.originalShape ?? undefined)
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
        this.originalShapes = []
        this.originalBoundingBox = null
        this.initialRotationAngle = 0
        
        this.toolManager.clearTool()
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