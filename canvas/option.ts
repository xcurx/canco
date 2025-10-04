class CanvasOption{
    public name: string
    public category: string
    public icon: string

    constructor(name:string ,category:string ,icon=""){
        this.name = name
        this.category = category
        this.icon = icon
    }
}

export {CanvasOption}
