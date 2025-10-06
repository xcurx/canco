import { Renderer } from "./renderer"

const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): Renderer | null => {
    if(ctx){
        const renderer = new Renderer(ctx, canvas)
        // renderer.addEventListners()
        renderer.animate()
        return renderer
    }

    return null
}

export {render}