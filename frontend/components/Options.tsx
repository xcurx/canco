import { RendererContext } from '@/components/renderer-context'
import React, { useContext, useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RectangleHorizontal, Circle as CircleIcon, LineChartIcon, Undo, Redo, Type } from 'lucide-react'
import { Button } from './ui/button'

const Options = () => {
    const {renderer} = useContext(RendererContext)
    const [currentOption, setCurrentOption] = useState<string | undefined>("")
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

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

        if (value === "text") {
            setCurrentOption("text")
            renderer?.setCurrentTool("text")
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

    const handleHistoryChange = () => {
        console.log("History changed")
        if (renderer) {
            setCanUndo(renderer.canUndo())
            setCanRedo(renderer.canRedo())
        }
    }

    useEffect(() => {
        if (renderer) {
            renderer.setHistoryCallbacks({
                onHistoryChange: handleHistoryChange
            })
            renderer.setToolCallbacks({
                onToolChange: (tool) => setCurrentOption(tool || "")
            })
        }
    }, [renderer])

    console.log("Can undo: ", canUndo)
    console.log("Can redo: ", canRedo)

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
            <ToggleGroupItem value="text"><Type/></ToggleGroupItem>
        </ToggleGroup>
        
        {/* Undo/Redo buttons */}
        <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={!renderer || !canUndo}>
                <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={!renderer || !canRedo}>
                <Redo className="w-4 h-4" />
            </Button>
        </div>
    </div>
  )
}

export default Options
