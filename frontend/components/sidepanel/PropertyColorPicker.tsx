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
  const [value, setValue] = useState("white")
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
    <>
      <label className="font-bold text-sm">{label}</label>
      <ToggleGroup type="single" variant="outline" value={value}
        onValueChange={handleChange} className="rounded-sm gap-2">
        {COLORS.map(c => (
          <ToggleGroupItem key={c} className="border-none p-0 h-auto" value={c}>
            <ColorBox color={c} selected={value === c} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  )
}

export default PropertyColorPicker
