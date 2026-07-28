import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ShapeData } from "@/canvas/type"
import { ToolType } from "@/canvas/tools"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const checkProperty = (shape: ShapeData, property: string): boolean => {
  return property in shape
}

const shapePropertyMap = {
    line: ['color', 'strokeWidth', 'opacity'],
    rectangle: ['color', 'fillColor', 'strokeWidth', 'opacity'],
    circle: ['color', 'fillColor', 'strokeWidth', 'opacity'],
    text: ['color', 'text', 'fontSize', 'opacity'],
} as const satisfies Record<ShapeData['type'], readonly string[]>

export const checkPropertyForTool = (type: ToolType, property: string): boolean => {
    if (!type) return false
    const props = shapePropertyMap[type as keyof typeof shapePropertyMap]
    return props ? (props as readonly string[]).includes(property) : false
}