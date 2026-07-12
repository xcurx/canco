import ColorPicker from "./sidepanel/ColorPicker"

const SidePanel = () => {

  return (
    <div className="bg-slate-900/60 p-4 rounded-md backdrop-blur-sm border absolute left-4 top-1/4 z-10 flex flex-col items-start gap-2">
        <ColorPicker/>
    </div>
  )
}

export default SidePanel