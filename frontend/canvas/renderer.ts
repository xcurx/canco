import { ShapeData, CanvasState as CanvasStateEnum, Operation } from './type'
import { CanvasState } from './state'
import { renderShape } from './renderShapes'
import { HistoryCallbacks, HistoryManager } from './history'
import { ToolManager } from './tools'
import { InteractionManager, InteractionCallbacks } from './interaction'
import { Socket, Message } from '../websocket/socket'
import { Camera } from './camera'

export class Renderer {
    private ctx: CanvasRenderingContext2D
    private canvas: HTMLCanvasElement
    
    private canvasState: CanvasState = new CanvasState()
    
    private historyManager: HistoryManager
    private toolManager: ToolManager = new ToolManager()
    private interactionManager: InteractionManager
    private camera: Camera = new Camera()
    
    private tempShape: ShapeData | null = null
    private currentInteractionState: CanvasStateEnum = CanvasStateEnum.IDLE
    private editingShapeId: string | null = null

    private socket: Socket | null = null
    private roomId?: string

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, roomId?: string) {
        this.ctx = ctx
        this.canvas = canvas
        
        const callbacks: InteractionCallbacks = {
            onStateChange: (state) => this.handleStateChange(state),
            onApplyOperation: (operation, saveToHistory, originalShape) => this.applyOperation(operation, false, saveToHistory, originalShape),
            onUpdateTempShape: (shape) => this.updateTempShape(shape),
            onUndo: () => this.undo(),
            onRedo: () => this.redo(),
            onCameraChange: () => this.render(),
            onEditText: (shape) => this.onEditTextCallback?.(shape)
        }
        
        this.historyManager = new HistoryManager(() => this.canvasState)
        this.interactionManager = new InteractionManager(
            canvas,
            callbacks,
            () => this.canvasState,
            this.toolManager,
            this.camera
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

    private applyOperation(operation: Operation, isSocket = false, saveToHistory=false, originalShape?: ShapeData): void {
        console.log(this.getDebugInfo())

        if (isSocket) {
            // we don't care about the selection state of remote shapes.
            if (operation.type === 'CREATE_SHAPE') {
                operation.data.shape.isSelected = false
            }
            this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
            this.render()
            return
        }

        if (saveToHistory) {
            console.log("Saving to history", operation)
            if (operation.type !== "DESELECT_ALL") {
                this.historyManager.addOperation(operation, originalShape)
                this.socket?.sendMessage("operation", operation)
            } else if (this.canvasState.getSelectedShape() !== null) {
                this.historyManager.addOperation(operation, originalShape)
                this.socket?.sendMessage("operation", operation)
            }
        }

        console.log("Applying operation:", operation)
        this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
            
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
        // console.log("Interaction state changed to:", state)
        
        this.updateCursor(state)
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

    render(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        this.ctx.save()
        this.ctx.setTransform(
            this.camera.scale,
            0,
            0,
            this.camera.scale,
            this.camera.offsetX * this.camera.scale,
            this.camera.offsetY * this.camera.scale
        )
        
        const shapes = this.canvasState.getAllShapes()
        shapes.forEach(shape => {
            if (shape.id !== this.editingShapeId) {
                renderShape(this.ctx, shape)
            }
        })
        
        if (this.tempShape) {
            renderShape(this.ctx, this.tempShape)
        }

        this.ctx.restore()
    }

    private updateCursor(state: CanvasStateEnum): void {
        switch (state) {
            case CanvasStateEnum.CREATING_SHAPE:
                this.canvas.style.cursor = 'crosshair'
                break
            case CanvasStateEnum.MOVING_OBJECT:
                this.canvas.style.cursor = 'move'
                break
            case CanvasStateEnum.RESIZING_OBJECT:
                this.canvas.style.cursor = 'nw-resize'
                break
            case CanvasStateEnum.IDLE:
            default:
                this.canvas.style.cursor = this.toolManager.hasActiveTool() ? 'crosshair' : 'default'
                break
        }
    }

    setCurrentTool(tool: string | null): void {
        this.toolManager.setCurrentTool(tool as any)
        this.updateCursor(this.currentInteractionState)
        console.log(`Tool set to: ${tool}`)
    }

    setColor(color: string): void {
        this.toolManager.setColor(color)
        console.log(`Color set to: ${color}`)
    }

    undo(): boolean {
        const result = this.historyManager.undo()
        if (result) {
            if (this.socket?.conn.readyState === WebSocket.OPEN) {
                this.socket.sendMessage("undo", null)
            } else {
                this.canvasState = result.state
                this.render()
            }
            console.log("Undo successful")
            return true
        }
        console.log("Nothing to undo")
        return false
    }

    redo(): boolean {
        const result = this.historyManager.redo()
        if (result) {
            if (this.socket?.conn.readyState === WebSocket.OPEN) {
                this.socket.sendMessage("redo", null)
            } else {
                this.canvasState = result.state
                this.render()
            }
            console.log("Redo successful")
            return true
        }
        console.log("Nothing to redo")
        return false
    }

    canUndo(): boolean {
        return this.historyManager.canUndo()
    }

    canRedo(): boolean {
        return this.historyManager.canRedo()
    }

    setHistoryCallbacks(callbacks: HistoryCallbacks): void {
        this.historyManager.setCallbacks(callbacks)
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