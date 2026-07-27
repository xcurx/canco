import { Cursor } from "./cursor"

export type ToolType = 'rectangle' | 'circle' | 'line' | 'text' | 'select'| 'pan' | null

export interface ToolManagerCallbacks {
    onToolChange?: (tool: ToolType) => void
}

export class ToolManager {
    private currentTool: ToolType = null
    private color: string = '#ffffff'
    private fillColor: string = ""
    private strokeWidth: number = 2
    private listners: Set<() => void> = new Set()
    private snapshot: ToolType = null

    constructor (private cursor: Cursor, private callbacks?: ToolManagerCallbacks) {
        this.callbacks = callbacks
    }

    setCurrentTool(tool: ToolType): void {
        this.currentTool = tool
        this.notifyChange()
        this.cursor.setCursorForTool(tool)
    }

    getCurrentTool(): ToolType {
        return this.currentTool
    }

    hasActiveTool(): boolean {
        return this.currentTool !== null
    }

    setCallbacks(callbacks: ToolManagerCallbacks) {
        this.callbacks = callbacks
    }

    setColor(color: string): void {
        this.color = color
        console.log(`Tool color changed to: ${color}`)
    }

    getColor(): string {
        return this.color
    }

    setFillColor(color: string): void {
        this.fillColor = color
        console.log(`Tool fill color changed to: ${color}`)
    }

    getFillColor(): string {
        return this.fillColor
    }

    setStrokeWidth(width: number): void {
        this.strokeWidth = Math.max(1, width) // Minimum width of 1
        console.log(`Stroke width changed to: ${this.strokeWidth}`)
    }

    getStrokeWidth(): number {
        return this.strokeWidth
    }

    subscribe = (listner: () => void) => {
        this.listners.add(listner)
        return () => this.listners.delete(listner)
    }

    getSnapshot = () => {
        return this.snapshot
    }

    private notifyChange() {
        const next = this.currentTool
        if (next !== this.snapshot) {
            this.snapshot = next
            this.listners.forEach(listner => listner())
        }
    }

    clearTool(): void {
        this.currentTool = null
        this.notifyChange()
        this.cursor.setCursorForTool(null)
    }
}