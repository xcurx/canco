import PropertyColorPicker from "./sidepanel/PropertyColorPicker"
import { useContext } from "react"
import { RendererContext } from "./renderer-context"
import { useShapeProperty } from "@/lib/hook"

const SidePanel = () => {
  const {renderer} = useContext(RendererContext)
  const { isVisible: colorVisible } = useShapeProperty(renderer, "color")
  const { isVisible: fillVisible } = useShapeProperty(renderer, "fillColor")

  if (!colorVisible && !fillVisible) return null

  return (
    <div className="bg-slate-900/60 p-4 rounded-md backdrop-blur-sm border absolute left-4 top-1/4 z-10 flex flex-col items-start gap-2">
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
    </div>
  )
}

export default SidePanel