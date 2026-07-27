import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useContext, useEffect, useState } from "react"
import { RendererContext } from "../renderer-context"
import { checkProperty } from "@/lib/utils"
import { useShapeProperty } from "@/lib/hook"
import { CanvasState } from "@/canvas/state"
import { ShapeData } from "@/canvas/type"
import ColorBox from "./ColorBox"
import { COLORS } from "@/lib/constants"

type PropertyColorPickerProps = {
  propertyKey: string
  label: string
  setToolValue: (v: string) => void
}

const PropertyColorPicker = ({ propertyKey, label, setToolValue }: PropertyColorPickerProps) => {
  const { renderer } = useContext(RendererContext)
  const [value, setValue] = useState("#ffffff")
  const { isVisible, selectedShapes } = useShapeProperty(renderer, propertyKey)

  const handleChange = (newColor: string) => {
    setValue(newColor)
    setToolValue(newColor)
    selectedShapes.forEach(s => {
      if (checkProperty(s, propertyKey)) {
        renderer?.applyOperation(
          CanvasState.updateShape(s.id, { [propertyKey]: newColor }),
          false, true, s
        )
      }
    })
  }

  useEffect(() => {
    if (renderer && selectedShapes.length > 0 && checkProperty(selectedShapes[0], propertyKey)) {
      setValue(selectedShapes[0][propertyKey as keyof ShapeData] as string)
    }
  }, [selectedShapes])

  if (!isVisible) {
    return null
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="font-medium text-xs text-zinc-400 uppercase tracking-wider">{label}</label>
      <ToggleGroup type="single" variant="outline" value={value}
        onValueChange={handleChange} className="gap-1.5 grid grid-cols-6">
        {COLORS.map(c => (
          <ToggleGroupItem key={c} className="border-none p-0.5 h-auto hover:bg-white/[0.08]" value={c}>
            <ColorBox color={c} selected={value === c} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export default PropertyColorPicker
