"use client";

import { useState } from "react";
import type { Renderer } from "@/canvas/renderer";
import Canvas from "@/components/Canvas";
import Collaborate from "@/components/Collaborate";
import Options from "@/components/Options";
import { RendererContext } from "@/components/renderer-context";

interface CanvasClientProps {
  roomId: string;
  isAuthed: boolean;
  signInAction: (formData: FormData) => Promise<void>;
  signOutAction: (formData: FormData) => Promise<void>;
  token: string | undefined;
}

export default function CanvasClient({
  roomId,
  isAuthed,
  signInAction,
  signOutAction,
  token,
}: CanvasClientProps) {
  const [renderer, setRenderer] = useState<Renderer | null>(null);

  return (
    <div className="h-screen w-screen">
      <RendererContext.Provider value={{ renderer, setRenderer }}>
        <div className="h-full w-full relative flex justify-center items-center">
          <Options />
          <Collaborate
            roomId={roomId}
            isAuthed={isAuthed}
            signInAction={signInAction}
            signOutAction={signOutAction}
            token={token}
          />
          <Canvas roomId={roomId} />
        </div>
      </RendererContext.Provider>
    </div>
  );
}
