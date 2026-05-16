"use client";

import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Renderer } from "@/canvas/renderer";

export interface RendererContextType {
  renderer: Renderer | null;
  setRenderer: Dispatch<SetStateAction<Renderer | null>>;
}

export const RendererContext = createContext<RendererContextType>({
  renderer: null,
  setRenderer: () => {},
});
