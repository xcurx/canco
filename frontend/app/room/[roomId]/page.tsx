"use client"

import { Renderer } from "@/canvas/renderer";
import Canvas from "@/components/Canvas";
import Options from "@/components/Options";
import ShareButton from "@/components/ShareButton";
import Collaborate from "@/components/ui/Collaborate";
import { createContext, useState, use } from "react";

interface RendererContextType {
  renderer: Renderer | null;
  setRenderer: React.Dispatch<React.SetStateAction<Renderer | null>>;
}

export const RendererContext = createContext<RendererContextType>({
  renderer: null, 
  setRenderer: () => {}
}); 

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const [renderer, setRenderer] = useState<Renderer | null>(null);

  return (
    <div className="h-screen w-screen">
      <RendererContext.Provider value={{renderer, setRenderer}}>
        <div className="h-full w-full relative flex justify-center items-center">
          <Options/>
          <Collaborate roomId={roomId} />
          <Canvas roomId={roomId} />
        </div>
      </RendererContext.Provider>
    </div>
  );
}