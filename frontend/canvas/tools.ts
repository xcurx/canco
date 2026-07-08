export type ToolType = 'rectangle' | 'circle' | 'line' | 'text' | 'select'| 'pan' | null

export interface ToolManagerCallbacks {
    onToolChange: (tool: ToolType) => void
}

export class ToolManager {
    private currentTool: ToolType = null
    private color: string = 'white'
    private strokeWidth: number = 2

    constructor (private callbacks?: ToolManagerCallbacks) {
        this.callbacks = callbacks
    }

    setCurrentTool(tool: ToolType): void {
        this.currentTool = tool
        this.callbacks?.onToolChange(tool)
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

    setStrokeWidth(width: number): void {
        this.strokeWidth = Math.max(1, width) // Minimum width of 1
        console.log(`Stroke width changed to: ${this.strokeWidth}`)
    }

    getStrokeWidth(): number {
        return this.strokeWidth
    }

    clearTool(): void {
        this.currentTool = null
        this.callbacks?.onToolChange(null)
    }
}