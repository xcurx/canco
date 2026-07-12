import { useSyncExternalStore } from 'react'
import type { HistoryManager } from '@/canvas/history'

const DEFAULT_SNAPSHOT = { canUndo: false, canRedo: false }
const defaultSubscribe = () => () => {}
const defaultGetSnapshot = () => DEFAULT_SNAPSHOT

export function useHistory(historyManager: HistoryManager | null) {
    const snapshot = useSyncExternalStore(
        historyManager?.subscribe ?? defaultSubscribe,
        historyManager?.getSnapshot ?? defaultGetSnapshot,
        defaultGetSnapshot
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