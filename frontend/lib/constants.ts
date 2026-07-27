import { RectangleHorizontal, Circle as CircleIcon, LineChartIcon, Type, MousePointer2, Hand } from 'lucide-react'

export const OPTIONS = [
  {
    value: "select",
    icon: MousePointer2,
  },
  {
    value: "pan",
    icon: Hand,
  },
  {
    value: "rectangle",
    icon: RectangleHorizontal,
  },
  {
    value: "circle",
    icon: CircleIcon,
  },
  {
    value: "line",
    icon: LineChartIcon,
  },
  {
    value: "text",
    icon: Type,
  }
]

export const COLORS = [
  "#ffffff", // white
  "#ced4da", // light gray
  "#868e96", // gray
  "#1e1e1e", // near black
  "#e03131", // red
  "#e8590c", // orange
  "#fcc419", // yellow
  "#2f9e44", // green
  "#1098ad", // cyan
  "#1971c2", // blue
  "#6741d9", // violet
]

export const STROKE_WIDTHS = [1, 3, 5]