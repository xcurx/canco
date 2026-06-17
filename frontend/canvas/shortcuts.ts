export type ShortcutCallbacks = {
    onUndo: () => void
    onRedo: () => void
    onDelete: () => void
    onEscape: () => void
    onSpaceDown: () => void
    onSpaceUp: () => void
}

export class ShortcutManager {
    constructor(private callbacks: ShortcutCallbacks) {
        this.addEventListners()
    }
    
    public addEventListners() {
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
    }

    public cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown)
        window.removeEventListener('keyup', this.handleKeyUp)
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        // ignore if typing in a text input
        if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
            return
        }

        let handled = false

        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            this.callbacks.onUndo()
            handled = true
        }
        // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
        else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
            this.callbacks.onRedo()
            handled = true
        }
        // Delete or Backspace
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            this.callbacks.onDelete()
            handled = true
        }
        // Escape
        else if (e.key === 'Escape') {
            this.callbacks.onEscape()
            handled = true
        }
        // Spacebar (for panning)
        else if (e.code === 'Space') {
            this.callbacks.onSpaceDown()
            handled = true
        }
        if (handled) {
            e.preventDefault()
        }
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            this.callbacks.onSpaceUp()
        }
    }
}