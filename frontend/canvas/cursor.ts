import { ToolType } from "./tools"
import { CanvasState as CanvasStateEnum} from "./type"

export class Cursor {
    private cursor: string = 'default'
    private canvas: HTMLCanvasElement

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
    }

    getCursor(): string {
        return this.cursor
    }

    setCursor(cursor: string): void {
        this.cursor = cursor
        this.canvas.style.cursor = cursor
    }

    setCursorForTool(tool: ToolType) {
        switch (tool) {
            case 'select':
                this.setCursor('default')
                break
            case 'pan':
                this.setCursor('grab')
                break
            case 'text':
                this.setCursor('text')
                break
            case 'rectangle':
            case 'circle':
            case 'line':
                this.setCursor('crosshair')
                break
            default:
                this.setCursor('default')
        }
    }

    setCursorForState(state: CanvasStateEnum) {
        switch (state) {
            case CanvasStateEnum.IDLE:
                this.setCursor('default')
                break
            case CanvasStateEnum.PANNING:
                this.setCursor('grab')
                break
            case CanvasStateEnum.MOVING_OBJECT:
                this.setCursor('move')
                break
            case CanvasStateEnum.RESIZING_OBJECT:
                this.setCursor('nw-se-resize')
                break
            case CanvasStateEnum.CREATING_SHAPE:
                this.setCursor('crosshair')
                break
            case CanvasStateEnum.ROTATING_OBJECT:
                this.setCursor('crosshair')
                break
            case CanvasStateEnum.SELECTING_MULTIPLE:
                this.setCursor('cell')
                break
            default:
                this.setCursor('default')
        }
    }
}