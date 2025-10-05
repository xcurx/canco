import React from "react"
import { Point } from "./point"
import { CanvasCoords } from "./renderer"

export class Segment{
    public p1: Point
    public p2: Point

    constructor(p1: Point, p2: Point){
        this.p1 = p1
        this.p2 = p2
    }

    draw(ctx:CanvasRenderingContext2D){
        ctx.beginPath()
        ctx.moveTo(this.p1.x,this.p1.y)
        ctx.lineTo(this.p2.x,this.p2.y)
        ctx.strokeStyle = "white"
        ctx.stroke()
    }

    isHovered = (coords:CanvasCoords) => {
        if(this.p1.x == this.p2.x){
            return (this.p1.x - 10 <= coords.x && this.p1.x + 15 >= coords.x) && 
                   ((this.p1.y <= coords.y && this.p2.y >= coords.y) ||
                   (this.p2.y <= coords.y && this.p1.y >= coords.y)) 
        }
        if(this.p1.y == this.p2.y){
            return (this.p1.y - 10 <= coords.y && this.p1.y + 15 >= coords.y) && 
                   ((this.p1.x <= coords.x && this.p2.x >= coords.x) ||
                   (this.p2.x <= coords.x && this.p1.x >= coords.x)) 
        }
    }
}