import { CanvasOption } from "./option";
import { Point } from "./point";
import { Segment } from "./segment";

// class Shape extends CanvasOption{
class Shape extends CanvasOption{
    public pos: {x:number|undefined, y:number|undefined}
    public dim: {width:number, height:number}
    public points: Point[]
    public segments: Segment[]
    public color: string

    constructor(name: string){
        super(name, "Shape", "square")

        this.pos = {
            x:undefined,
            y:undefined
        }
        this.dim = {
            width:0,
            height:0
        }

        this.points = []
        this.segments = []

        this.color = "#c61010"
    }

    drawCage(ctx:CanvasRenderingContext2D){
        if(ctx){
            this.points.forEach(point => point.draw(ctx))
            this.segments.forEach(segment => segment.draw(ctx))
        }
    }

    updatePoints(){
        if (this.pos.x === undefined || this.pos.y === undefined) return;

        let points = []
        points.push(new Point(this.pos.x, this.pos.y))
         points.push(new Point(this.pos.x+(this.dim.width)/2, this.pos.y))
        points.push(new Point(this.pos.x+this.dim.width, this.pos.y))
         points.push(new Point(this.pos.x+this.dim.width, this.pos.y+(this.dim.height)/2))
        points.push(new Point(this.pos.x+this.dim.width, this.pos.y+this.dim.height))
         points.push(new Point(this.pos.x+(this.dim.width)/2, this.pos.y+this.dim.height)) 
        points.push(new Point(this.pos.x, this.pos.y+this.dim.height))
         points.push(new Point(this.pos.x, this.pos.y+(this.dim.height)/2))

        let segments = []
        for(let i=0; i<points.length; i++){
            segments.push(new Segment(points[i], points[(i+1)%points.length]))
        }

        this.points = [...points]
        this.segments = [...segments]
    }

    updateDimensions(startX:number, startY:number, endX:number, endY:number){
        this.pos.x = startX
        this.pos.y = startY
        this.dim.width = endX - startX
        if(this.dim.width < 0){
            this.dim.width = -this.dim.width
            this.pos.x -= this.dim.width
        } 
        this.dim.height = endY - startY
        if(this.dim.height < 0){
            this.dim.height = -this.dim.height
            this.pos.y -= this.dim.height
        } 
        this.updatePoints()
    }

    resize(point:Point, newX:number, newY:number){
        console.log("Postion", this.pos);
        if (this.pos.x === undefined || this.pos.y === undefined) return;

        if (point.x === this.pos.x && point.y === this.pos.y){
            // Top-left corner
            this.updateDimensions(newX, newY, this.pos.x + this.dim.width, this.pos.y + this.dim.height);
        }else if(point.x === this.pos.x + this.dim.width && point.y === this.pos.y){
            // Top-right corner
            this.updateDimensions(this.pos.x, newY, newX, this.pos.y + this.dim.height);
        }else if(point.x === this.pos.x + this.dim.width && point.y === this.pos.y + this.dim.height){
            // Bottom-right corner
            this.updateDimensions(this.pos.x, this.pos.y, newX, newY);
        }else if(point.x === this.pos.x && point.y === this.pos.y + this.dim.height){
            // Bottom-left corner
            this.updateDimensions(newX, this.pos.y, this.pos.x + this.dim.width, newY);
        }else if(point.y === this.pos.y){
            // Top-middle (vertical resize)
            this.updateDimensions(this.pos.x, newY, this.pos.x + this.dim.width, this.pos.y + this.dim.height);
        }else if(point.y === this.pos.y + this.dim.height){
            // Bottom-middle (vertical resize)
            this.updateDimensions(this.pos.x, this.pos.y, this.pos.x + this.dim.width, newY);
        }else if(point.x === this.pos.x){
            // Left-middle (horizontal resize)
            this.updateDimensions(newX, this.pos.y, this.pos.x + this.dim.width, this.pos.y + this.dim.height);
        }else if(point.x === this.pos.x + this.dim.width){
            // Right-middle (horizontal resize)
            this.updateDimensions(this.pos.x, this.pos.y, newX, this.pos.y + this.dim.height);
        }
    }

    move(offsetX:number, offsetY:number){
        this.pos.x = offsetX
        this.pos.y = offsetY
        this.updatePoints()
    }
}

export { Shape }