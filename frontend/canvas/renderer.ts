import { ShapeData, CanvasState as CanvasStateEnum, Operation } from './type'
import { CanvasState } from './state'
import { renderShape } from './renderShapes'
import { HistoryManager } from './history'
import { ToolManager } from './tools'
import { InteractionManager, InteractionCallbacks } from './interaction'
import { Socket, Message } from '../websocket/socket'

export class Renderer {
    private ctx: CanvasRenderingContext2D
    private canvas: HTMLCanvasElement
    
    private canvasState: CanvasState = new CanvasState()
    
    private historyManager = new HistoryManager()
    private toolManager = new ToolManager()
    private interactionManager: InteractionManager
    
    private tempShape: ShapeData | null = null
    private currentInteractionState: CanvasStateEnum = CanvasStateEnum.IDLE

    private socket: Socket | null = null

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, url: string) {
        this.ctx = ctx
        this.canvas = canvas
        
        const callbacks: InteractionCallbacks = {
            onStateChange: (state) => this.handleStateChange(state),
            onApplyOperation: (operation) => this.applyOperation(operation),
            onUpdateTempShape: (shape) => this.updateTempShape(shape),
            onUndo: () => this.undo(),
            onRedo: () => this.redo()
        }
        
        this.interactionManager = new InteractionManager(
            canvas,
            callbacks,
            () => this.canvasState,
            this.toolManager
        )

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

    private applyOperation(operation: Operation, isSocket = false): void {
        console.log(this.getDebugInfo())

        if (isSocket) {
            this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
            this.render()
            return
        }

        if (operation.type !== "DESELECT_ALL") {
            this.historyManager.addOperation(operation)
        } else if (this.canvasState.getSelectedShape() !== null) {
            this.historyManager.addOperation(operation)
        }
        console.log("Applying operation:", operation)
        this.socket?.sendMessage("operation", operation)
        this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
            
        this.render()
    }

    initializeSocket(url: string): void {
        if (!this.socket) {
            this.socket = new Socket(url, {
                onOpen: () => {
                    console.log('WebSocket connection opened')
                },
                onMessage: (msg) => {
                    console.log('Received message:', msg)
                    this.onMessage(msg)
                }
            })
            this.socket.onMessage()
        }
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

    render(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        
        const shapes = this.canvasState.getAllShapes()
        shapes.forEach(shape => {
            renderShape(this.ctx, shape)
        })
        
        if (this.tempShape) {
            renderShape(this.ctx, this.tempShape)
        }
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
        const newState = this.historyManager.undo()
        if (newState) {
            this.canvasState = newState
            this.render()
            console.log("Undo successful")
            return true
        }
        console.log("Nothing to undo")
        return false
    }

    redo(): boolean {
        const result = this.historyManager.redo()
        if (result) {
            this.canvasState = result.state
            this.render()
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

    clear(): void {
        this.canvasState = new CanvasState()
        this.historyManager.clear()
        this.render()
        console.log("Canvas cleared")
    }

    getCanvasState(): CanvasState {
        return this.canvasState
    }

    // getToolConfig() {
    //     return this.toolManager.getToolConfig()
    // }

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
        this.applyOperation(msg.data, true)
    }

    animate = (): void => {
        this.render()
    }
}