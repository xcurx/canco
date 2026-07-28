import { ShapeData, CanvasState as CanvasStateEnum, Operation } from './type'
import { CanvasState } from './state'
import { drawMultiSelectionCage, drawSelectionCage, renderShape } from './renderShapes'
import { HistoryManager } from './history'
import { ToolManager } from './tools'
import { InteractionManager, InteractionCallbacks } from './interaction'
import { Socket, Message } from '../websocket/socket'
import { Camera } from './camera'
import { Cursor } from './cursor'

export class Renderer {
    private ctx: CanvasRenderingContext2D
    private canvas: HTMLCanvasElement
    
    private canvasState: CanvasState = new CanvasState()
    
    public historyManager: HistoryManager
    public toolManager: ToolManager
    public cursor: Cursor

    private interactionManager: InteractionManager
    private camera: Camera = new Camera()
    
    private tempShape: ShapeData | null = null
    private currentInteractionState: CanvasStateEnum = CanvasStateEnum.IDLE
    private editingShapeId: string | null = null

    private socket: Socket | null = null
    private roomId?: string

    private listners: Set<() => void> = new Set()
    private selectedSnapshot: ShapeData[] = []
    private pendingNotify = false

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, roomId?: string) {
        this.ctx = ctx
        this.canvas = canvas
        
        const callbacks: InteractionCallbacks = {
            onStateChange: (state) => this.handleStateChange(state),
            onApplyOperation: (operation, saveToHistory, originalShape) => this.applyOperation(operation, false, saveToHistory, originalShape),
            onUpdateTempShape: (shape) => this.updateTempShape(shape),
            onUndo: () => this.historyManager.undo(),
            onRedo: () => this.historyManager.redo(),
            onCameraChange: () => this.render(),
            onEditText: (shape) => this.onEditTextCallback?.(shape)
        }
        
        this.historyManager = new HistoryManager(() => this.canvasState, {onHistoryChange: (result) => this.onHistoryChange(result)})
        this.cursor = new Cursor(canvas)
        this.toolManager = new ToolManager(this.cursor)
        this.interactionManager = new InteractionManager(
            canvas,
            callbacks,
            () => this.canvasState,
            this.toolManager,
            this.camera,
            this.cursor,
        )

        let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'ws://localhost:8080';
        if (baseUrl.startsWith('http://')) {
            baseUrl = baseUrl.replace('http://', 'ws://');
        } else if (baseUrl.startsWith('https://')) {
            baseUrl = baseUrl.replace('https://', 'wss://');
        }
        
        const url = this.roomId ? `${baseUrl}/api/join/${this.roomId}` : undefined

        if (url) {
            this.socket = new Socket(url, {
                onOpen: () => {
                    console.log('WebSocket connection opened')
                },
                onMessage: (msg) => {
                    console.log('Received message:', msg)
                    this.onMessage(msg)
                }
            })
        }

        this.render()
        
        addEventListener("resize", this.handleResize)   
    }

    public applyOperation(operation: Operation, isSocket = false, saveToHistory=false, originalShape?: ShapeData): void {
        if (isSocket) {
            // we don't care about the selection state of remote shapes.
            if (operation.type === 'CREATE_SHAPE') {
                operation.data.shape.isSelected = false
            }

            const selectedShapeIds = this.getSelectedShapes().map(s => s.id)
            const currentState = this.getInteractionState()
            const isInteracting = currentState === CanvasStateEnum.MOVING_OBJECT || 
                currentState === CanvasStateEnum.RESIZING_OBJECT ||
                currentState === CanvasStateEnum.ROTATING_OBJECT
            
            // only ignore incoming updates if we are interacting with the same shape
            if (isInteracting) {
                if (operation.type === "UPDATE_SHAPE") {
                    if (selectedShapeIds.includes(operation.data.id)) return
                } else if (operation.type === "UPDATE_SHAPES") {
                    // filter updates targeting selected shapes
                    operation.data.updates = operation.data.updates.filter((u: any) => !selectedShapeIds.includes(u.id))
                    if (operation.data.updates.length === 0) return;
                }
            }

            this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
            this.render()
            return
        }

        if (saveToHistory) {
            if (operation.type !== "DESELECT_ALL") {
                this.historyManager.addOperation(operation, originalShape)
                const payload = { ...operation }
                delete payload.inverse
                this.socket?.sendMessage("operation", payload)
            } else if (this.canvasState.getSelectedShape() !== null) {
                this.historyManager.addOperation(operation, originalShape)
                const payload = { ...operation }
                delete payload.inverse
                this.socket?.sendMessage("operation", payload)
            }
        }

        this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
        this.notifyChange()
            
        this.render()
    }

    initializeSocket(url: string, setLoading: (loading: boolean) => void): void {
        if (!this.socket) {
            this.socket = new Socket(url, {
                onOpen: () => {
                    console.log('WebSocket connection opened')
                },
                onMessage: (msg) => {
                    console.log('Received message:', msg)
                    this.onMessage(msg)
                },
                onClose: () => {
                    console.log('WebSocket connection closed')
                }
            })
            const waitForConnection = (socket: WebSocket, callback: () => void) => {
                setTimeout(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        callback()
                    } else {
                        waitForConnection(socket, callback)
                    }
                }, 5)
            }
            waitForConnection(this.socket.conn, () => {
                setLoading(false)
            })
            this.socket.onMessage()
        }
    }

    closeSocket(setLoading: (loading: boolean) => void): void {
        if (this.socket) {
            this.socket.close()
            const waitForConnection = (socket: WebSocket, callback: () => void) => {
                setTimeout(() => {
                    if (socket.readyState === WebSocket.CLOSING) {
                        callback()
                    } else {
                        waitForConnection(socket, callback)
                    }
                }, 5)
            }
            waitForConnection(this.socket.conn, () => {
                setLoading(false)
            })
        }
        this.socket = null
    }

    private handleStateChange(state: CanvasStateEnum): void {
        this.currentInteractionState = state
        this.cursor.setCursorForState(state)
    }

    private updateTempShape(shape: ShapeData | null): void {
        this.tempShape = shape
        this.render()
    }

    public deleteShape(shapeId: string) {
        this.applyOperation(CanvasState.deleteShape(shapeId), false, true)
    }

    private onEditTextCallback?: (shape: ShapeData) => void

    public setEditTextCallback(cb: (shape: ShapeData) => void) {
        this.onEditTextCallback = cb
    }

    public updateText(shapeId: string, newText: string, width: number, height: number, originalShape: ShapeData) {
        this.applyOperation(CanvasState.updateShape(shapeId, { text: newText, width, height }), false, true, originalShape)
    }

    public getCamera() {
        return this.camera
    }

    public setEditingShapeId(id: string | null) {
        this.editingShapeId = id
        this.render()
    }

    public getEditingShapeId() {
        return this.editingShapeId
    }

    public getSelectedShapes() {
        if (this.canvasState.isMultiSelected) {
            return this.canvasState.getSelectedShapes()
        }
        const shape = this.canvasState.getSelectedShape()
        return shape ? [shape] : []
    }

    subscribe = (listner: () => void) => {
        this.listners.add(listner)
        return () => this.listners.delete(listner)
    }

    getSnapshot = () => {
        return this.selectedSnapshot
    }

    private notifyChange = () => {
        if (this.pendingNotify) return
        this.pendingNotify = true
        requestAnimationFrame(() => {
            this.pendingNotify = false
            const next = this.getSelectedShapes()
            if (JSON.stringify(next) !== JSON.stringify(this.selectedSnapshot)) {
                this.selectedSnapshot = next
                this.listners.forEach(listner => listner())
            }
        })
    }

    render(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        this.ctx.save()
        const dpr = window.devicePixelRatio || 1
        this.ctx.setTransform(
            this.camera.scale * dpr,
            0,
            0,
            this.camera.scale * dpr,
            this.camera.offsetX * this.camera.scale * dpr,
            this.camera.offsetY * this.camera.scale * dpr
        )
        
        const shapes = this.canvasState.getAllShapes()
        for (const shape of shapes) {
            if (shape.id !== this.editingShapeId) {
                renderShape(this.ctx, shape)
            }
        }
        if (this.canvasState.isMultiSelected) {
            const selectedShapes = this.canvasState.getSelectedShapes()
            
            for (const shape of selectedShapes) {
                drawSelectionCage(this.ctx, shape, false) // false = hide handles
            }
            drawMultiSelectionCage(this.ctx, selectedShapes)
            
        } else {
            const selectedShape = this.canvasState.getSelectedShape()
            if (selectedShape && selectedShape.id !== this.editingShapeId) {
                drawSelectionCage(this.ctx, selectedShape, true)
            }
        }
        
        if (this.tempShape) {
            if (this.currentInteractionState === CanvasStateEnum.SELECTING_MULTIPLE) {
                renderShape(this.ctx, this.tempShape, false)
            } else {
                renderShape(this.ctx, this.tempShape)
            }
        }

        this.ctx.restore()
    }

    onHistoryChange(result: {type: "undo" | "redo", state: CanvasState}) {
        if (this.socket?.conn.readyState === WebSocket.OPEN) {
            this.socket.sendMessage(result.type, null)
        } else {
            this.canvasState = result.state
            this.render()
        }
    }

    clear(): void {
        this.canvasState = new CanvasState()
        this.historyManager.clear()
        this.render()
        console.log("Canvas cleared")
    }

    getCanvasState(): CanvasState {
        return this.canvasState
    }

    getInteractionState(): CanvasStateEnum {
        return this.currentInteractionState
    }

    getDebugInfo() {
        return {
            shapes: this.canvasState.getAllShapes().length,
            selectedShape: this.canvasState.getSelectedShape()?.id || null,
            interactionState: this.currentInteractionState,
            history: this.historyManager.getHistoryInfo(),
            // tool: this.toolManager.getToolConfig()
        }
    }

    exportState(): string {
        const exportData = {
            shapes: this.canvasState.getAllShapes(),
            timestamp: Date.now(),
            version: '1.0'
        }
        return JSON.stringify(exportData, null, 2)
    }

    importState(jsonString: string): boolean {
        try {
            const importData = JSON.parse(jsonString)
            if (importData.shapes && Array.isArray(importData.shapes)) {
                this.canvasState = new CanvasState(importData.shapes)
                this.historyManager.clear()
                this.render()
                console.log(`Imported ${importData.shapes.length} shapes`)
                return true
            }
        } catch (error) {
            console.error("Failed to import state:", error)
        }
        return false
    }

    cleanup(): void {
        this.interactionManager.cleanup()
        removeEventListener("resize", this.handleResize)
        console.log("Renderer cleaned up")
    }

    private handleResize = (): void => {
        this.ctx.canvas.width = innerWidth
        this.ctx.canvas.height = innerHeight
        this.render()
    }

    private onMessage = (msg: Message): void => {
        console.log('Received message:', msg)
        if (msg.type == "join") {
            this.historyManager.clear()
            this.canvasState = new CanvasState(msg.data as ShapeData[])
            this.render()
            return
        }
        this.applyOperation(msg.data, true)
    }

    animate = (): void => {
        this.render()
    }
}