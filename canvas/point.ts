export class Point {
    public x: number
    public y: number
    public radius: number

    constructor(x:number ,y:number ,radius=5){
        this.x = x
        this.y = y
        this.radius = radius
    }

    draw(ctx:CanvasRenderingContext2D){
        ctx.beginPath()
        ctx.arc(this.x,this.y,this.radius,0,2*Math.PI)
        ctx.fillStyle = "white"
        ctx.fill()
    }
}