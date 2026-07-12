import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useContext, useState } from "react"
import { RendererContext } from "../renderer-context"


const ColorPicker = () => {
    const {renderer} = useContext(RendererContext)
    const [color, setColor] = useState<string>("white")

    const handleChangeColor = (color: string) => {
        setColor(color)
        renderer?.toolManager.setColor(color)
    }

  return (
    <>
        <label className="font-bold text-sm" htmlFor="color-picker">Stroke color</label>
        <ToggleGroup 
            id="color-picker"
            type="single" 
            variant={"outline"} 
            value={color}
            onValueChange={(value) => handleChangeColor(value)}
            className="rounded-sm gap-2"
        >
            <ToggleGroupItem className={`border-none p-0 h-auto`} value="white"><ColorBox color="white" selected={color === "white"} /></ToggleGroupItem>
            <ToggleGroupItem className={`border-none p-0 h-auto`} value="red"><ColorBox color="red" selected={color === "red"} /></ToggleGroupItem>
            <ToggleGroupItem className={`border-none p-0 h-auto`} value="yellow"><ColorBox color="yellow" selected={color === "yellow"} /></ToggleGroupItem>
            <ToggleGroupItem className={`border-none p-0 h-auto`} value="blue"><ColorBox color="blue" selected={color === "blue"} /></ToggleGroupItem>
            <ToggleGroupItem className={`border-none p-0 h-auto`} value="green"><ColorBox color="green" selected={color === "green"} /></ToggleGroupItem>   
        </ToggleGroup>
    </>
  )
}

function ColorBox({color, selected}:{color: string, selected?: boolean}) {
    return (
        <div className={`w-5 h-5 rounded-md cursor-pointer ${selected ? "ring-2 ring-offset-2 ring-offset-black ring-white" : ""}`} style={{backgroundColor: color}} />
    )
}

export default ColorPicker