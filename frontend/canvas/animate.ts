import { Renderer } from "./renderer"

const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, roomId: string): Renderer | null => {
    if(ctx){
        const renderer = new Renderer(ctx, canvas, roomId)
        // renderer.addEventListners()
        renderer.animate()
        return renderer
    }

    return null
}

export {render}