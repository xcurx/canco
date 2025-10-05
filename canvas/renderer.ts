import { Circle } from "./circle"
import { Point } from "./point"
import { Rectangle } from "./rectangle"
import { Shape } from "./shape"

enum CanvasState {
    IDLE = "idle",
    CREATING_SHAPE = "creating_shape", 
    MOVING_OBJECT = "moving_object",
    RESIZING_OBJECT = "resizing_object"
}

type Object = Rectangle | Circle
export type CanvasCoords = {x: number, y: number}

class Renderer{
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement

    currentOption: {new(): Object} | null
    objects: Object[]
    current: Object | null

    state: CanvasState

    hover: {object: Object, point: Point} | null

    isSelectable: Object | null
    selected: Object | null

    dragOffset: {x:number,y:number} | undefined

    startPoint: {x:number | null, y:number | null}

    color: string

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement){
        this.ctx = ctx
        this.canvas = canvas

        this.currentOption = null
        this.objects = []
        this.current = null

        this.state = CanvasState.IDLE

        this.hover = null
        
        this.isSelectable = null
        this.selected = null

        this.dragOffset

        this.startPoint = {
            x:null,
            y:null
        }

        this.color = "white"
    }

    private getCanvasCoordinates(e: MouseEvent): {x: number, y: number} {
        const rect = this.canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    add(obj: Object){
        this.objects.push(obj)
    }

    render(){
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.objects.forEach(obj => {
            obj.draw(this.ctx)
        })

        if(this.current && this.state === CanvasState.CREATING_SHAPE){
            this.current.draw(this.ctx)
        }
    }

    handleMouseDown = (e: MouseEvent) => {
        console.log("Down")
        
        const canvasCoords = this.getCanvasCoordinates(e)
        this.startPoint.x = canvasCoords.x
        this.startPoint.y = canvasCoords.y

        this.checkSelection(canvasCoords)
        
        if(this.selected){
            if (this.selected.pos.x === undefined || this.selected.pos.y === undefined) return;
            this.checkMouseHoverPoint(canvasCoords)
            if(this.checkMove(canvasCoords)){
                this.state = CanvasState.MOVING_OBJECT
                this.dragOffset = {
                    x: canvasCoords.x - this.selected.pos.x,
                    y: canvasCoords.y - this.selected.pos.y
                }
            }
        }else{
            this.hover = null
            this.state = CanvasState.IDLE
        }

        if(this.hover){
            this.state = CanvasState.RESIZING_OBJECT
        }else if(this.isSelectable){
            this.isSelectable.isSelected = true
            if(this.selected && this.selected != this.isSelectable){
                this.selected.isSelected = false
            }
            this.selected = this.isSelectable
        }else if(this.state === CanvasState.IDLE && this.currentOption){
            this.state = CanvasState.CREATING_SHAPE
            this.current = new this.currentOption()
            this.current.color = this.color
            if(this.selected){
                this.selected.isSelected = false
            }
            this.selected = this.current
            this.current.updateDimensions(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y)
        }   
        // console.log(this.selected);
    }
    
    handleMouseMove = (e: MouseEvent) => {
        const canvasCoords = this.getCanvasCoordinates(e)
        if(this.state === CanvasState.RESIZING_OBJECT){
            this.checkMouseHoverPoint(canvasCoords)
        }

        if(this.state === CanvasState.CREATING_SHAPE && this.current){
            if (this.startPoint.x === null || this.startPoint.y === null) return;
            this.current.updateDimensions(this.startPoint.x, this.startPoint.y, canvasCoords.x, canvasCoords.y)
            this.selected = this.current
            this.render()
            requestAnimationFrame(this.animate)
        }
        
        else if(this.state === CanvasState.RESIZING_OBJECT){
            if(!this.hover || !this.hover.point) return
            const hoverIndex = this.objects.indexOf(this.hover?.object)
            const hoverPointIndex = this.objects[hoverIndex].points.indexOf(this.hover.point)
            this.objects[hoverIndex].resize(this.hover.point, canvasCoords.x, canvasCoords.y)
            this.hover.object = this.objects[hoverIndex]
            this.hover.point = this.objects[hoverIndex].points[hoverPointIndex]
            this.selected = this.hover.object
            this.render()
            requestAnimationFrame(this.animate)
        }

        else if(this.state === CanvasState.MOVING_OBJECT){
            if(!this.selected || !this.dragOffset) return
            const offsetX = canvasCoords.x - this.dragOffset.x;
            const offsetY = canvasCoords.y - this.dragOffset.y;
            this.selected.move(offsetX,offsetY)
            this.render()
            requestAnimationFrame(this.animate)
        }
    }

    handleMouseUp = () => {
        if(this.current && (Math.abs(this.current.dim.width) > 15 && Math.abs(this.current.dim.height) > 15)){
            this.add(this.current)
        }else if(!this.hover && !this.isSelectable && this.state !== CanvasState.MOVING_OBJECT){
            this.selected = null
        }
        this.state = CanvasState.IDLE
        this.hover = null
        this.current = null
        // console.log(this.selected);
        this.render();
    }

    addEventListners(){
        this.canvas.addEventListener("mousedown", this.handleMouseDown)
        this.canvas.addEventListener("mousemove", this.handleMouseMove)
        this.canvas.addEventListener("mouseup", this.handleMouseUp)
        addEventListener("resize", this.handleResize)
    }

    cleanup(){
        this.canvas.removeEventListener("mousedown", this.handleMouseDown)
        this.canvas.removeEventListener("mousemove", this.handleMouseMove)
        this.canvas.removeEventListener("mouseup", this.handleMouseUp)
        removeEventListener("resize", this.handleResize)
    }

    handleResize = () => {
        this.ctx.canvas.width = innerWidth
        this.ctx.canvas.height = innerHeight
        this.render()
    }

    checkMouseHoverPoint = (coords: CanvasCoords) => {
        if(this.state === CanvasState.RESIZING_OBJECT || !this.selected) return
        let isHovering = false
        for(let i=0; i<this.selected.points.length; i++){
            isHovering =
                coords.x >= this.selected.points[i].x - this.selected.points[i].radius &&
                coords.x <= this.selected.points[i].x + this.selected.points[i].radius &&
                coords.y >= this.selected.points[i].y - this.selected.points[i].radius &&
                coords.y <= this.selected.points[i].y + this.selected.points[i].radius

            if(isHovering){
                this.hover = {
                    object: this.selected,
                    point: this.selected.points[i]
                } 
                return
            }
        }
        if(!isHovering){
            this.hover = null
        }
    }

    checkSelection = (coords: CanvasCoords) => {
        let isSelectable = false
        for(let i=0; i<this.objects.length; i++){
            isSelectable = this.objects[i].checkSelection(coords)
            if(isSelectable){
                this.isSelectable = this.objects[i]
                return
            }
        }
        if(!isSelectable){
            this.isSelectable = null
        }
    }

    checkMove = (coords: CanvasCoords) => {
        if(!this.selected) return
        const isMovePossible = (this.selected.points[0].x <= coords.x && this.selected.points[0].y <= coords.y
                               && this.selected.points[4].x >= coords.x && this.selected.points[4].y >= coords.y)
                               || (this.selected.points[4].x <= coords.x && this.selected.points[4].y <= coords.y
                               && this.selected.points[0].x >= coords.x && this.selected.points[0].y >= coords.y)
        return isMovePossible
    }

    animate = () => {
        this.render();
    }
}

export { Renderer }