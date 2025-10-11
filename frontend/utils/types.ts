import { Renderer } from "@/canvas/renderer";

interface RendererContextType {
  renderer: Renderer | null;
  setRenderer: React.Dispatch<React.SetStateAction<Renderer | null>>;
}