import { 
    ShapeData, 
    CanvasCoords, 
    CanvasState as CanvasStateEnum,
    Operation
} from './type'
import { CanvasState, createRectangleData, createCircleData } from './state'
import { renderShape, isPointInShape, getClickedHandle, getResizeHandles, isPointInShapeInterior } from './rendering'

export class Renderer {
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    
    private canvasState: CanvasState = new CanvasState()
    private operationHistory: Operation[] = []

    currentShapeType: string | null = null
    state: CanvasStateEnum = CanvasStateEnum.IDLE

    private tempShape: ShapeData | null = null
    private dragOffset: {x: number, y: number} | null = null
    private resizeHandle: { x: number, y: number, type: string } | null = null
    private startPoint: CanvasCoords | null = null

    private hoveredShape: ShapeData | null = null
    private clickedHandle: { x: number, y: number, type: string } | null = null

    color: string = 'white'

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, initialShapes?: ShapeData[]) {
        this.ctx = ctx
        this.canvas = canvas
        this.canvasState = new CanvasState(initialShapes)
        this.addEventListeners()
        this.render()
    }

    private applyOperation(operation: Operation) {
        this.canvasState = CanvasState.applyOperation(this.canvasState, operation)
        this.operationHistory.push(operation)
        this.render()
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        const shapes = this.canvasState.getAllShapes()
        shapes.forEach(shape => {
            renderShape(this.ctx, shape)
        })

        if (this.tempShape && this.state === CanvasStateEnum.CREATING_SHAPE) {
            renderShape(this.ctx, this.tempShape)
        }
    }

    private getCanvasCoordinates(e: MouseEvent): CanvasCoords {
        const rect = this.canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    handleMouseDown = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)
        this.startPoint = coords

        const selectedShape = this.canvasState.getSelectedShape()
        if (selectedShape) {
            this.clickedHandle = getClickedHandle(coords, selectedShape)
            if (this.clickedHandle) {
                this.state = CanvasStateEnum.RESIZING_OBJECT
                this.resizeHandle = this.clickedHandle
                return
            }

            if (isPointInShapeInterior(coords, selectedShape)) {
                this.state = CanvasStateEnum.MOVING_OBJECT
                this.dragOffset = {
                    x: coords.x - selectedShape.x,
                    y: coords.y - selectedShape.y
                }
                return
            }
        }

        const shapes = this.canvasState.getAllShapes()
        let clickedShape: ShapeData | null = null
        // reverse order to prioritize topmost shapes
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInShape(coords, shapes[i])) {
                clickedShape = shapes[i]
                break
            }
        }

        if (clickedShape) {
            if (!clickedShape.isSelected) {
                this.applyOperation(CanvasState.selectShape(clickedShape.id))
            }

            // prepare for potential move
            this.state = CanvasStateEnum.MOVING_OBJECT
            this.dragOffset = {
                x: coords.x - clickedShape.x,
                y: coords.y - clickedShape.y
            }
        } else {
            this.applyOperation(CanvasState.deselectAll())
            if (this.currentShapeType) {
                this.state = CanvasStateEnum.CREATING_SHAPE
                this.startCreateShape(coords)
            } else {
                this.state = CanvasStateEnum.IDLE
            }
        }
    }

    handleMouseMove = (e: MouseEvent) => {
        const coords = this.getCanvasCoordinates(e)

        switch(this.state) {
            case CanvasStateEnum.CREATING_SHAPE:
                if (this.tempShape && this.startPoint) {
                    this.updateTempShape(this.startPoint, coords)
                    this.render()
                }
                break

            case CanvasStateEnum.MOVING_OBJECT:
                const selectedShape = this.canvasState.getSelectedShape()
                if (selectedShape && this.dragOffset) {
                    const newX = coords.x - this.dragOffset.x
                    const newY = coords.y - this.dragOffset.y
                    this.applyOperation(CanvasState.updateShape(selectedShape.id, { x: newX, y: newY }))
                }
                break

            case CanvasStateEnum.RESIZING_OBJECT:
                const resizingShape = this.canvasState.getSelectedShape()
                if (resizingShape && this.resizeHandle) {
                    const newDimensions = this.calculateResize(resizingShape, this.resizeHandle, coords)
                    this.applyOperation(CanvasState.updateShape(resizingShape.id, newDimensions))
                }
                break
        }
    }

    handleMouseUp = (e: MouseEvent) => {
        if (this.state === CanvasStateEnum.CREATING_SHAPE && this.tempShape) {
            //only add if its big enough
            if (Math.abs(this.tempShape.width) > 15 && Math.abs(this.tempShape.height) > 15) {
                this.applyOperation(CanvasState.createShape(this.tempShape))
            }
        }

        this.state = CanvasStateEnum.IDLE
        this.tempShape = null
        this.dragOffset = null
        this.resizeHandle = null
        this.startPoint = null
        this.clickedHandle = null

        this.render()
    }

    private startCreateShape(coords: CanvasCoords) {
        if (!this.currentShapeType) return

        switch (this.currentShapeType) {
            case 'rectangle':
                this.tempShape = createRectangleData(coords.x, coords.y, 0, 0, this.color)
                break
            case 'circle':
                this.tempShape = createCircleData(coords.x, coords.y, 0, 0, this.color)
                break
        }
    }

    private updateTempShape(startCoords: CanvasCoords, currentCoords: CanvasCoords) {
        if (!this.tempShape) return

        const width = currentCoords.x - startCoords.x
        const height = currentCoords.y - startCoords.y

        this.tempShape.x = width < 0 ? startCoords.x + width : startCoords.x
        this.tempShape.y = height < 0 ? startCoords.y + height : startCoords.y
        this.tempShape.width = Math.abs(width)
        this.tempShape.height = Math.abs(height)
    }

    private calculateResize(shape: ShapeData, handle: { x: number, y: number, type: string }, currentCoords: CanvasCoords): Partial<ShapeData> {
        const newDimensions: Partial<ShapeData> = {}

        switch (handle.type) {
            case 'top-left':
                newDimensions.x = currentCoords.x
                newDimensions.y = currentCoords.y
                newDimensions.width = (shape.x + shape.width) - currentCoords.x
                newDimensions.height = (shape.y + shape.height) - currentCoords.y
                break
            case 'top-middle':
                newDimensions.y = currentCoords.y
                newDimensions.height = (shape.y + shape.height) - currentCoords.y
                break
            case 'top-right':
                newDimensions.y = currentCoords.y
                newDimensions.width = currentCoords.x - shape.x
                newDimensions.height = (shape.y + shape.height) - currentCoords.y
                break
            case 'middle-left':
                newDimensions.x = currentCoords.x
                newDimensions.width = (shape.x + shape.width) - currentCoords.x
                break
            case 'middle-right':
                newDimensions.width = currentCoords.x - shape.x
                break
            case 'bottom-left':
                newDimensions.x = currentCoords.x
                newDimensions.width = (shape.x + shape.width) - currentCoords.x
                newDimensions.height = currentCoords.y - shape.y
                break
            case 'bottom-middle':
                newDimensions.height = currentCoords.y - shape.y
                break
            case 'bottom-right':
                newDimensions.width = currentCoords.x - shape.x
                newDimensions.height = currentCoords.y - shape.y
                break
        }

        if (newDimensions.width !== undefined) {
            newDimensions.width = Math.max(newDimensions.width, 15)
        }

        if (newDimensions.height !== undefined) {
            newDimensions.height = Math.max(newDimensions.height, 15)
        }

        return newDimensions
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown)
        this.canvas.addEventListener('mousemove', this.handleMouseMove)
        this.canvas.addEventListener('mouseup', this.handleMouseUp)
        addEventListener('resize', this.handleResize)
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown)
        this.canvas.removeEventListener('mousemove', this.handleMouseMove)
        this.canvas.removeEventListener('mouseup', this.handleMouseUp)
        removeEventListener('resize', this.handleResize)
    }

    handleResize = () => {
        this.ctx.canvas.width = innerWidth
        this.ctx.canvas.height = innerHeight
        this.render()
    }

    animate = () => {
        this.render()
    }

    setCurrentTool(tool: string | null) {
        this.currentShapeType = tool
    }

    getState() {
        return {
            canvasState: this.canvasState,
            currentTool: this.currentShapeType,
            interactionState: this.state
        }
    }
}