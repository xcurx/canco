import { useSyncExternalStore } from 'react'
import type { HistoryManager } from '@/canvas/history'
import { Renderer } from '@/canvas/renderer'
import type { ShapeData } from '@/canvas/type'
import { ToolManager } from '@/canvas/tools'
import { checkProperty, checkPropertyForTool } from '@/lib/utils'

const DEFAULT_HISTORY_SNAPSHOT = { canUndo: false, canRedo: false }
const DEFAULT_RENDERER_SNAPSHOT: ShapeData[] = []
const DEFAULT_TOOL_SNAPSHOT = null
const defaultSubscribe = () => () => {}
const defaultGetHistorySnapshot = () => DEFAULT_HISTORY_SNAPSHOT
const defaultGetRendererSnapshot = () => DEFAULT_RENDERER_SNAPSHOT
const defaultGetToolSnapshot = () => DEFAULT_TOOL_SNAPSHOT

export function useHistory(historyManager: HistoryManager | null) {
    const snapshot = useSyncExternalStore(
        historyManager?.subscribe ?? defaultSubscribe,
        historyManager?.getSnapshot ?? defaultGetHistorySnapshot,
        defaultGetHistorySnapshot
    )
    return {
        canUndo: snapshot.canUndo,
        canRedo: snapshot.canRedo,
        undo: () => {
            historyManager?.undo()
        },
        redo: () => {
            historyManager?.redo()
        },
    }
}

export function useSelectedShapes(renderer: Renderer | null) {
    const snapshot = useSyncExternalStore(
        renderer?.subscribe ?? defaultSubscribe,
        renderer?.getSnapshot ?? defaultGetRendererSnapshot,
        defaultGetRendererSnapshot
    )
    return snapshot
}

export function useSelectedTool(toolManager: ToolManager | null) {
    const snapshot = useSyncExternalStore(
        toolManager?.subscribe ?? defaultSubscribe,
        toolManager?.getSnapshot ?? defaultGetToolSnapshot,
        defaultGetToolSnapshot
    )
    return snapshot
}

export function useShapeProperty(renderer: Renderer | null, propertyKey: string) {
    const selectedShapes = useSelectedShapes(renderer)
    const currentTool = useSelectedTool(renderer?.toolManager ?? null)

    const isVisible = !renderer
        || checkPropertyForTool(currentTool, propertyKey)
        || selectedShapes.some(s => checkProperty(s, propertyKey))

    return { isVisible, selectedShapes, currentTool }
}