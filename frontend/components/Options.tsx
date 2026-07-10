import { RendererContext } from '@/components/renderer-context'
import { useContext, useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RectangleHorizontal, Circle as CircleIcon, LineChartIcon, Undo, Redo, Type, MousePointer2, Hand } from 'lucide-react'
import { Button } from './ui/button'
import { useHistory } from '@/lib/hook'

const Options = () => {
    const {renderer} = useContext(RendererContext)
    const [currentOption, setCurrentOption] = useState<string | undefined>("select")
    const { canUndo, canRedo } = useHistory(renderer?.historyManager ?? null)

    const handleOptionChange = (value: string) => {
        if (!renderer) return
        console.log("Option changed to: ", value);

        renderer.toolManager.setCurrentTool(value as any)
        setCurrentOption(value)
    }

    useEffect(() => {
        if (renderer) {
            renderer.toolManager.setCallbacks({
                onToolChange: (tool) => setCurrentOption(tool || "select")
            })
        }
    }, [renderer])

  return (
    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2'>
        <ToggleGroup 
            type="single" 
            variant={"outline"} 
            value={currentOption}
            onValueChange={(value) => handleOptionChange(value)}
        >
            <ToggleGroupItem value="select"><MousePointer2/></ToggleGroupItem>
            <ToggleGroupItem value="pan"><Hand/></ToggleGroupItem>
            <ToggleGroupItem value="rectangle"><RectangleHorizontal/></ToggleGroupItem>
            <ToggleGroupItem value="circle"><CircleIcon/></ToggleGroupItem>   
            <ToggleGroupItem value="line"><LineChartIcon/></ToggleGroupItem>
            <ToggleGroupItem value="text"><Type/></ToggleGroupItem>
        </ToggleGroup>
        
        {/* Undo/Redo buttons */}
        <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => renderer?.historyManager.undo()} disabled={!renderer || !canUndo}>
                <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => renderer?.historyManager.redo()} disabled={!renderer || !canRedo}>
                <Redo className="w-4 h-4" />
            </Button>
        </div>
    </div>
  )
}

export default Options
