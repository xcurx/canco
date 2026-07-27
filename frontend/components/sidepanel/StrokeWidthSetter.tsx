import { useContext, useEffect, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group"
import { STROKE_WIDTHS } from "@/lib/constants"
import { ChevronDownIcon, ChevronUpIcon, Minus } from "lucide-react"
import { NumberField, NumberFieldDecrement, NumberFieldGroup, NumberFieldIncrement, NumberFieldInput } from "../ui/number-field"
import { RendererContext } from "../renderer-context"
import { useShapeProperty } from "@/lib/hook"
import { checkProperty } from "@/lib/utils"
import { CanvasState } from "@/canvas/state"
import { ShapeData } from "@/canvas/type"

const StrokeWidthSetter = () => {
    const { renderer } = useContext(RendererContext)
    const [strokeWidth, setStrokeWidth] = useState<number>(1)
    const { isVisible, selectedShapes } = useShapeProperty(renderer, "strokeWidth")
    
    const handleChange = (value: number) => {
        setStrokeWidth(value)
        if (!value || isNaN(value)) return
        
        renderer?.toolManager.setStrokeWidth(value)
        selectedShapes.forEach(s => {
            if (checkProperty(s, 'strokeWidth')) {
                renderer?.applyOperation(
                    CanvasState.updateShape(s.id, { strokeWidth: value }),
                    false, true, s
                )
            }
        })
    }
    
    useEffect(() => {
        if (renderer && selectedShapes.length > 0 && checkProperty(selectedShapes[0], 'strokeWidth')) {
          setStrokeWidth(selectedShapes[0]['strokeWidth' as keyof ShapeData] as number)
        }
    }, [selectedShapes])
    
    if (!isVisible) {
        return null
    }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="font-medium text-xs text-zinc-400 uppercase tracking-wider">Stroke Width</label>
      <ToggleGroup type="single" value={strokeWidth?.toString() || ""}
        onValueChange={(v) => { if (v) handleChange(Number(v)) }} className="flex items-center justify-between gap-2">
        <div className="gap-1.5 grid grid-cols-3">
            {STROKE_WIDTHS.map(sw => (
            <ToggleGroupItem key={sw} className="border-none p-0.5 h-auto hover:bg-white/[0.08]" value={sw.toString()}>
                <StrokeBox strokeWidth={sw} selected={strokeWidth === sw} />
            </ToggleGroupItem>
            ))}
        </div>
        <div className="w-full max-w-18 h-full">
            <NumberField value={strokeWidth} onValueChange={(v) => handleChange(v as number)} min={1} max={100} size="sm">
                <NumberFieldGroup>
                    <NumberFieldInput />
                    <div className="border-input bg-muted/30 rounded-lg flex shrink-0 flex-col overflow-hidden border">
                        <NumberFieldIncrement className="border-input hover:bg-accent focus-visible:bg-accent flex h-3.5 w-full flex-1 shrink-0 items-center rounded-none! border-b px-1.5 leading-none">
                        <ChevronUpIcon className="size-2.5" />
                        </NumberFieldIncrement>
                        <NumberFieldDecrement className="hover:bg-accent focus-visible:bg-accent flex h-3.5 w-full flex-1 shrink-0 items-center rounded-none! px-1.5 leading-none">
                        <ChevronDownIcon className="size-2.5" />
                        </NumberFieldDecrement>
                    </div>
                </NumberFieldGroup>
            </NumberField>
        </div>
      </ToggleGroup>
    </div>
  )
}

const StrokeBox = ({strokeWidth, selected}:{strokeWidth: number, selected?: boolean}) => {
    return (
        <div className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer ${selected ? "ring-2 ring-offset-2 ring-offset-black ring-white" : ""}`} >
            <Minus strokeWidth={strokeWidth}/>
        </div>
    )
}

export default StrokeWidthSetter