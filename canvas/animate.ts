import { Renderer } from "./renderer"

const render = (ctx: CanvasRenderingContext2D): Renderer | null => {
    if(ctx){
        const renderer = new Renderer(ctx)
        renderer.addEventListners()
        renderer.animate()
        return renderer
    }

    return null
}

export {render}