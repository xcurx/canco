import { InteractionContext, InteractionHandler } from './interactionHandler'
import { CanvasCoords, CanvasState as CanvasStateEnum } from '../type'

export class PanHandler implements InteractionHandler {
    private lastPanPoint: { x: number, y: number }

    constructor(private context: InteractionContext, startEvent: PointerEvent) {
        this.lastPanPoint = { x: startEvent.clientX, y: startEvent.clientY }
        this.context.changeState(CanvasStateEnum.PANNING)
    }

    onMouseMove(coords: CanvasCoords, e: PointerEvent): void {
        this.context.camera.offsetX += (e.clientX - this.lastPanPoint.x) / this.context.camera.scale
        this.context.camera.offsetY += (e.clientY - this.lastPanPoint.y) / this.context.camera.scale
        this.lastPanPoint = { x: e.clientX, y: e.clientY }
        this.context.onCameraChange()
    }

    onMouseUp(coords: CanvasCoords, e: PointerEvent): void {
        // IDLE reset is handled globally by InteractionManager router
    }
}
