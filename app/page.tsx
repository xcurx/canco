"use client"

import { Renderer } from "@/canvas/renderer";
import Canvas from "@/components/Canvas";
import Options from "@/components/Options";
import { createContext, useState } from "react";
interface RendererContextType {
  renderer: Renderer | null;
  setRenderer: React.Dispatch<React.SetStateAction<Renderer | null>>;
}

export const RendererContext = createContext<RendererContextType>({renderer: null, setRenderer: () => {}}); 

export default function Home() {
  const [renderer, setRenderer] = useState<Renderer | null>(null);

  return (
    <div className="h-screen w-screen">
      <RendererContext.Provider value={{renderer, setRenderer}}>
        <div className="h-full w-full relative flex justify-center items-center">
          <Options/>
          <Canvas/>
        </div>
      </RendererContext.Provider>
    </div>
  );
}
