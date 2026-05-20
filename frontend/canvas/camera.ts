export class Camera {
    offsetX = 0
    offsetY = 0
    scale = 1

    screenToWorld(sx: number, sy: number) {
        return {
            x: sx / this.scale - this.offsetX,
            y: sy / this.scale - this.offsetY
        }
    }

    worldToScreen(wx: number, wy: number) {
        return {
            x: (wx + this.offsetX) * this.scale,
            y: (wy + this.offsetY) * this.scale
        }
    }
}