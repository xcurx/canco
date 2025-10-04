import { Shape } from "./shape";

class Rectangle extends Shape {
    public isSelected: boolean
    public rectPos: {x:number|undefined, y:number|undefined}
    public rectDim: {width:number, height:number}
    public difference: number

    constructor(){
        super("rect")
        this.isSelected = true

        this.rectPos = {
            x:undefined,
            y:undefined
        }
        this.rectDim = {
            width:0,
            height:0
        }

        this.difference = 5
    }

    draw(ctx: CanvasRenderingContext2D){
        this.updateRectDimentions()
        if (this.rectPos.x === undefined || this.rectPos.y === undefined) return;
        if(this.isSelected){
            this.drawCage(ctx)
        }
        ctx.beginPath()
        ctx.rect(this.rectPos.x,this.rectPos.y,this.rectDim.width,this.rectDim.height)
        ctx.strokeStyle = this.color
        ctx.stroke()
    }

    updateRectDimentions(){
        if (this.pos.x === undefined || this.pos.y === undefined) return;

        this.rectDim.width = this.dim.width - 2*this.difference 
        this.rectPos.x = this.pos.x + this.difference
        this.rectDim.height = this.dim.height - 2*this.difference
        this.rectPos.y = this.pos.y + this.difference
    }

    checkSelection(e: MouseEvent): boolean {
        let isSelectable = false
        for(let i=0; i<this.segments.length; i++){
            if(this.segments[i].isHovered(e)){
                isSelectable = true
                return isSelectable
            }
        }
        return isSelectable
    }
}

export { Rectangle }