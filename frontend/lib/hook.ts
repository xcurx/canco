import { useSyncExternalStore } from 'react'
import type { HistoryManager } from '@/canvas/history'

export function useHistory(historyManager: HistoryManager | null) {
    const snapshot = useSyncExternalStore(
        historyManager?.subscribe ?? (() => () => {}),
        historyManager?.getSnapshot ?? (() => ({ canUndo: false, canRedo: false })),
    )
    return snapshot
}