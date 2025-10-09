import { RendererContext } from '@/app/page'
import React, { useContext, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RectangleHorizontal, Circle as CircleIcon, LineChartIcon } from 'lucide-react'

const Options = () => {
    const {renderer} = useContext(RendererContext)
    const [currentOption, setCurrentOption] = useState<string | undefined>("")

    const handleOptionChange = (value: string) => {
        if (!renderer) return
        console.log("Option changed to: ", value);

        if (value === "") {
            setCurrentOption("")
            renderer.setCurrentTool(null)
            return
        }

        if (value === "line") {
            setCurrentOption("line")
            renderer.setCurrentTool("line")
            return
        }

        if (value === "rectangle") {
            setCurrentOption("rectangle")
            renderer.setCurrentTool("rectangle")
            return
        }

        if (value === "circle") {
            setCurrentOption("circle")
            renderer.setCurrentTool("circle")
            return
        }
    }

  return (
    <ToggleGroup 
     type="single" 
     variant={"outline"} 
     value={currentOption}
     onValueChange={(value) => handleOptionChange(value)}
     className='absolute top-4 left-1/2 -translate-x-1/2 z-10'
    >
      <ToggleGroupItem value="rectangle"><RectangleHorizontal/></ToggleGroupItem>
      <ToggleGroupItem value="circle"><CircleIcon/></ToggleGroupItem>   
      <ToggleGroupItem value="line"><LineChartIcon/></ToggleGroupItem>
    </ToggleGroup>
  )
}

export default Options
