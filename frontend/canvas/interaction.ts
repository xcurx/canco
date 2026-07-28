import { CanvasCoords, CanvasState as CanvasStateEnum, ShapeData, Operation } from './type'
import { CanvasState } from './state'
import { getClickedHandle, isPointInShape, isPointInShapeInterior, getResizehandlesFromCoords, isPointInHandle } from './selection'
import { ToolManager } from './tools'
import { Camera } from './camera'
import { ShortcutManager } from './shortcuts'
import { getShapesBoundingBox } from './utils'
import { InteractionContext, InteractionHandler } from './handlers/interactionHandler'
import { MoveHandler } from './handlers/moveHandler'
import { ResizeHandler } from './handlers/resizeHandler'
import { RotateHandler } from './handlers/rotateHandler'
import { CreateHandler } from './handlers/createHandler'
import { PanHandler } from './handlers/panHandler'
import { SelectHandler } from './handlers/selectHandler'
import { Cursor } from './cursor'

export type InteractionCallbacks = {
    onStateChange: (state: CanvasStateEnum) => void
    onApplyOperation: (operation: Operation, saveToHistory: boolean, originalShape?: ShapeData) => void
    onUpdateTempShape: (shape: ShapeData | null) => void
    onUndo: () => void
    onRedo: () => void
    onCameraChange: () => void
    onEditText?: (shape: ShapeData) => void
}

export class InteractionManager implements InteractionContext {
    private state: CanvasStateEnum = CanvasStateEnum.IDLE
    private activeHandler: InteractionHandler | null = null
    private shortcutManager: ShortcutManager

    // interface passthroughs
    getCanvasState = () => this._getCanvasState()
    applyOperation = (op: Operation, saveToHistory: boolean, originalShape?: ShapeData) => this.callbacks.onApplyOperation(op, saveToHistory, originalShape)
    updateTempShape = (shape: ShapeData | null) => this.callbacks.onUpdateTempShape(shape)
    changeState = (state: CanvasStateEnum) => { this.state = state; this.callbacks.onStateChange(state) }
    onCameraChange = () => this.callbacks.onCameraChange()
    get onEditText() { return this.callbacks.onEditText }

    constructor(
        private canvas: HTMLCanvasElement,
        private callbacks: InteractionCallbacks,
        private _getCanvasState: () => CanvasState,
        public toolManager: ToolManager,
        public camera: Camera,
        public cursor: Cursor,
    ) {
        this.addEventListeners()
        this.shortcutManager = new ShortcutManager({
            onUndo: () => this.callbacks.onUndo(),
            onRedo: () => this.callbacks.onRedo(),
            onDelete: () => {
                const canvasState = this.getCanvasState()
                if (canvasState.isMultiSelected) {
                    const selectedShapes = canvasState.getSelectedShapes()
                    if (selectedShapes.length > 0) this.applyOperation(CanvasState.deleteShapes(selectedShapes.map(s => s.id)), true)
                } else {
                    const selectedShape = canvasState.getSelectedShape()
                    if (selectedShape) this.applyOperation(CanvasState.deleteShape(selectedShape.id), true)
                }
            },
            onEscape: () => {
                this.toolManager.clearTool()
                this.applyOperation(CanvasState.deselectAll(), true)
            },
            onSpaceDown: () => {
                this.changeState(CanvasStateEnum.PANNING)
                this.cursor.setCursorForState(CanvasStateEnum.PANNING)
            },
            onSpaceUp: () => {
                this.changeState(CanvasStateEnum.IDLE)
                this.cursor.setCursorForState(CanvasStateEnum.IDLE)
            }
        })
    }

    handleMouseDown(coords: CanvasCoords, e: PointerEvent): void {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
        }
        e.preventDefault()
        if (e.button === 2) return
        
        // panning priority
        if (this.toolManager.getCurrentTool() === 'pan' || e.button === 1 || this.state === CanvasStateEnum.PANNING) {
            this.activeHandler = new PanHandler(this, e)
            this.cursor.setCursorForState(CanvasStateEnum.PANNING)
            return
        }

        const canvasState = this.getCanvasState()

        // multi selection checks
        if (canvasState.isMultiSelected) {
            const selectedShapes = canvasState.getSelectedShapes()
            if (selectedShapes.length > 0) {
                const box = getShapesBoundingBox(selectedShapes)
                if (box) {
                    const handles = getResizehandlesFromCoords(box.x, box.y, box.x + box.width, box.y + box.height, this.camera.scale)
                    for (const handle of handles) {
                        if (isPointInHandle(coords, handle, this.camera.scale)) {
                            if (handle.type === 'rotation') this.activeHandler = new RotateHandler(this, coords, selectedShapes)
                            else this.activeHandler = new ResizeHandler(this, handle, selectedShapes)
                            return
                        }
                    }
                    if (coords.x >= box.x && coords.x <= box.x + box.width && coords.y >= box.y && coords.y <= box.y + box.height) {
                        this.activeHandler = new MoveHandler(this, coords, selectedShapes)
                        return
                    }
                }
            }
        }

        // single shape checks
        const selectedShape = canvasState.getSelectedShape()
        if (selectedShape) {
            const handle = getClickedHandle(coords, selectedShape, this.camera.scale)
            if (handle) {
                if (handle.type === 'rotation') this.activeHandler = new RotateHandler(this, coords, [selectedShape])
                else this.activeHandler = new ResizeHandler(this, handle, [selectedShape])
                return
            }
            if (isPointInShapeInterior(coords, selectedShape)) {
                this.activeHandler = new MoveHandler(this, coords, [selectedShape])
                return
            }
        }

        // selection / deselection
        const shapes = canvasState.getAllShapes()
        const isShiftPressed = this.shortcutManager.getPressedKey() === "Shift"
        for (let i = shapes.length - 1; i >= 0; i--) {
            const select = "fillColor" in shapes[i] && (shapes[i] as any).fillColor !== "" ? 
                            isPointInShapeInterior(coords, shapes[i]) : 
                            isPointInShape(coords, shapes[i])
            if (select) {
                if (isShiftPressed) {
                    const currentSelected = canvasState.getSelectedShapes().map(s => s.id)
                    const newSelected = currentSelected.includes(shapes[i].id) 
                        ? currentSelected.filter(id => id !== shapes[i].id)
                        : [...currentSelected, shapes[i].id]
                    this.applyOperation(CanvasState.multiSelectShapes(newSelected), true)
                } else {
                    this.applyOperation(CanvasState.selectShape(shapes[i].id), true)
                    // for instant drag
                    this.activeHandler = new MoveHandler(this, coords, [shapes[i]])
                }
                return
            }
        }

        // empty space click
        this.applyOperation(CanvasState.deselectAll(), true)
        if (!this.toolManager.hasActiveTool()) {
            this.activeHandler = new SelectHandler(this, coords)
        } else {
            this.activeHandler = new CreateHandler(this, coords)
        }
    }

    handleMouseMove(coords: CanvasCoords, e: PointerEvent): void {
        e.preventDefault()
        if (this.activeHandler) this.activeHandler.onMouseMove(coords, e)
    }

    handleMouseUp(coords: CanvasCoords, e: PointerEvent): void {
        e.preventDefault()
        if (this.activeHandler) {
            this.activeHandler.onMouseUp(coords, e)
            if (this.activeHandler.cleanup) this.activeHandler.cleanup()
            this.activeHandler = null
            
            if (this.state === CanvasStateEnum.PANNING && this.shortcutManager.getPressedKey() === "Space") {
                this.cursor.setCursorForState(CanvasStateEnum.PANNING)
            } else {
                this.changeState(CanvasStateEnum.IDLE)
                this.toolManager.hasActiveTool() ? this.cursor.setCursorForState(CanvasStateEnum.CREATING_SHAPE) : this.cursor.setCursorForState(CanvasStateEnum.IDLE)
            }
        }
    }

    handleWheel(e: WheelEvent): void {
        e.preventDefault()
        const rect = this.canvas.getBoundingClientRect()
        const worldBefore = this.camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
        
        this.camera.scale = Math.max(0.1, Math.min(10, this.camera.scale * (e.deltaY < 0 ? 1.1 : 0.9)))
        const worldAfter = this.camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
        
        this.camera.offsetX += (worldAfter.x - worldBefore.x)
        this.camera.offsetY += (worldAfter.y - worldBefore.y)
        this.onCameraChange()
    }

    getState(): CanvasStateEnum { return this.state }
    
    cleanup(): void {
        this.canvas.removeEventListener("pointerdown", this.onPointerDown)
        this.canvas.removeEventListener("pointermove", this.onPointerMove)
        this.canvas.removeEventListener("pointerup", this.onPointerUp)
        this.canvas.removeEventListener("wheel", this.onWheel)
        this.canvas.removeEventListener("dblclick", this.onDoubleClick)
        this.canvas.removeEventListener("mousedown", this.onMouseDownPrevent)
        this.shortcutManager.cleanup()
    }

    private addEventListeners(): void {
        this.canvas.addEventListener("pointerdown", this.onPointerDown)
        this.canvas.addEventListener("pointermove", this.onPointerMove)
        this.canvas.addEventListener("pointerup", this.onPointerUp)
        this.canvas.addEventListener("wheel", this.onWheel, { passive: false })
        this.canvas.addEventListener("dblclick", this.onDoubleClick)
        // prevent native middle click auto scroll (pointerdown preventDefault is not enough in some browsers)  
        this.canvas.addEventListener("mousedown", this.onMouseDownPrevent)
    }

    private onPointerDown = (e: PointerEvent) => this.handleMouseDown(this.getCanvasCoordinates(e), e)
    private onPointerMove = (e: PointerEvent) => this.handleMouseMove(this.getCanvasCoordinates(e), e)
    private onPointerUp = (e: PointerEvent) => this.handleMouseUp(this.getCanvasCoordinates(e), e)
    private onWheel = (e: WheelEvent) => this.handleWheel(e)
    private onMouseDownPrevent = (e: MouseEvent) => { if (e.button === 1) e.preventDefault() }
    
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

    private getCanvasCoordinates(e: PointerEvent | MouseEvent): CanvasCoords {
        const rect = this.canvas.getBoundingClientRect()
        return this.camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    }
}
