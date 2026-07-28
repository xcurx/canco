"use client"
import { useContext, useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { RendererContext } from "../renderer-context"
import { useShapeProperty } from "@/lib/hook"
import { checkProperty } from "@/lib/utils"
import { CanvasState } from "@/canvas/state"
import { ShapeData } from "@/canvas/type"

export function OpacitySetter() {
    const { renderer } = useContext(RendererContext)
    const [value, setValue] = useState(1)
    const { isVisible, selectedShapes } = useShapeProperty(renderer, "opacity")
        
    const handleChange = (val: number) => {
        setValue(val)
        if (val === undefined || val === null || isNaN(val)) return
        
        renderer?.toolManager.setOpacity(val)
        selectedShapes.forEach(s => {
            if (checkProperty(s, 'opacity')) {
                renderer?.applyOperation(
                    CanvasState.updateShape(s.id, { opacity: val }),
                    false, true, s
                )
            }
        })
    }
    
    useEffect(() => {
        if (renderer && selectedShapes.length > 0 && checkProperty(selectedShapes[0], 'opacity')) {
            setValue(selectedShapes[0]['opacity' as keyof ShapeData] as number)
        }
    }, [selectedShapes])
    
    if (!isVisible) {
        return null
    }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <label className="font-medium text-xs text-zinc-400 uppercase tracking-wider">Opacity</label>
      <Slider
        value={[value]}
        onValueChange={(val: number | readonly number[]) => {
          const num = Array.isArray(val) ? val[0] : val
          handleChange(num)
        }}
        min={0}
        max={1}
        step={0.01}
      />
    </div>
  )
}
