import PropertyColorPicker from "./sidepanel/PropertyColorPicker"
import { useContext } from "react"
import { RendererContext } from "./renderer-context"
import { useShapeProperty } from "@/lib/hook"
import StrokeWidthSetter from "./sidepanel/StrokeWidthSetter"

const SidePanel = () => {
  const {renderer} = useContext(RendererContext)
  const { isVisible: colorVisible } = useShapeProperty(renderer, "color")
  const { isVisible: fillVisible } = useShapeProperty(renderer, "fillColor")

  if (!colorVisible && !fillVisible) return null

  return (
    <div className="dark glass p-3 rounded-2xl absolute left-4 top-1/4 z-10 flex flex-col items-start gap-5 shadow-xl">
        <PropertyColorPicker
          propertyKey="color"
          label="Stroke color"
          setToolValue={(v) => renderer?.toolManager.setColor(v)}
        />
        <PropertyColorPicker
          propertyKey="fillColor"
          label="Fill color"
          setToolValue={(v) => renderer?.toolManager.setFillColor(v)}
        />
        <StrokeWidthSetter/>
    </div>
  )
}

export default SidePanel