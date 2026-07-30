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

export const CURSOR_COLORS = [
  "#FF0000", // bright red
  "#00FF00", // bright green
  "#0000FF", // bright blue
  "#FF00FF", // magenta
  "#00FFFF", // cyan
  "#FFA500", // orange
  "#8A2BE2", // blue violet
  "#FF1493", // deep pink
  "#32CD32", // lime green
  "#FFD700", // gold
]

export const CURSOR_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="black" stroke="white" stroke-width="2" d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z">
      </path>
    </svg>
`