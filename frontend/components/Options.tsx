import { RendererContext } from '@/app/page'
import React, { useContext, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RectangleHorizontal, Circle as CircleIcon, LineChartIcon, Undo, Redo } from 'lucide-react'
import { Button } from './ui/button'

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

    const handleUndo = () => {
        if (renderer) {
            renderer.undo()
        }
    }

    const handleRedo = () => {
        if (renderer) {
            renderer.redo()
        }
    }

  return (
    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2'>
        <ToggleGroup 
            type="single" 
            variant={"outline"} 
            value={currentOption}
            onValueChange={(value) => handleOptionChange(value)}
        >
            <ToggleGroupItem value="rectangle"><RectangleHorizontal/></ToggleGroupItem>
            <ToggleGroupItem value="circle"><CircleIcon/></ToggleGroupItem>   
            <ToggleGroupItem value="line"><LineChartIcon/></ToggleGroupItem>
        </ToggleGroup>
        
        {/* Undo/Redo buttons */}
        <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={!renderer || !renderer.canUndo()}>
                <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={!renderer || !renderer.canRedo()}>
                <Redo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => renderer?.initializeSocket("ws:localhost:8080/api/join/12")}>
                Join
            </Button>
        </div>
    </div>
  )
}

export default Options
