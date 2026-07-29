import { CURSOR_SVG } from "@/lib/constants"
import { getColorForUser } from "@/lib/utils"

export class RemoteCursor {
    readonly color: string
    readonly name: string
    readonly id: string
    x: number = 0
    y: number = 0
    private targetX: number = 0
    private targetY: number = 0

    private svg: string = CURSOR_SVG;
    private img: HTMLImageElement;

    constructor(id: string, name: string, x: number = 0, y: number = 0) {
        this.id = id
        this.name = name
        this.color = getColorForUser(id)
        this.x = x
        this.y = y
        this.targetX = x
        this.targetY = y

        this.svg = this.svg.replaceAll("black", this.color)
        const svgBlob = new Blob([this.svg], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(svgBlob);
        this.img = new Image();
        this.img.src = url
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.drawImage(this.img, this.x, this.y, 24, 48)

        ctx.font = "14px sans-serif"
        ctx.textAlign = "center"
        const nameWidth = ctx.measureText(this.name).width
        const borderRadius = 4
        ctx.roundRect(this.x + 24/2 - nameWidth/2 - 4, this.y + 42, nameWidth + 8, 16, borderRadius)
        ctx.fillStyle = this.color
        ctx.fill()

        ctx.fillStyle = "white"
        ctx.fillText(this.name, this.x + 24/2, this.y + 48 + 6)
        ctx.restore()
    }

    update(newX: number, newY: number) {
        this.targetX = newX
        this.targetY = newY
    }

    updateInterpolation(): boolean {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            this.x = this.targetX;
            this.y = this.targetY;
            return false;
        }

        // lerp factor (higher is faster, lower is smoother)
        this.x += dx * 0.4;
        this.y += dy * 0.4;
        return true;
    }
}