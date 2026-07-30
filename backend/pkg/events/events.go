package events

import (
	"encoding/json"
	"log"

	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/types"
)

type EventHandler struct {
	db *database.DB
	isPersistent bool
}

func New(db *database.DB, isPersistent bool) *EventHandler {
    return &EventHandler{
		db: db,
		isPersistent: isPersistent,
	}
}

func (h *EventHandler) HandleOperation(data interface{}, room *types.Room, userID string) {
    var op types.Operation
	bytes, err := json.Marshal(data)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}

	if err := json.Unmarshal(bytes, &op); err != nil {
		log.Println("Unmarshal error at start:", err)
		return
	}

	
	room.Mutex.Lock()
	inverse := ComputeInverse(op, room.RoomState)
	op.Inverse = inverse
	room.Mutex.Unlock()
	
	switch op.Type {
	case types.CreateShape:
		createShape(op, room, userID, h.db, h.isPersistent)

	case types.UpdateShape:
		updateShape(op, room, userID, h.db, h.isPersistent)

	case types.DeleteShape:
		deleteShape(op, room, userID, h.db, h.isPersistent)

	case types.SelectShape:
		room.Mutex.Lock()
		room.Mutex.Unlock()
		// room.BroadcastEvent("SELECT_SHAPE", op.Data)

	case types.MultiSelectShapes:
		room.Mutex.Lock()
		room.Mutex.Unlock()
		// room.BroadcastEvent("MULTISELECT_SHAPES", op.Data)

	case types.CreateShapes:
		createShapes(op, room, userID, h.db, h.isPersistent)

	case types.UpdateShapes:
		updateShapes(op, room, userID, h.db, h.isPersistent)

	case types.DeleteShapes:
		deleteShapes(op, room, userID, h.db, h.isPersistent)

	case types.DeselectAll:
		room.Mutex.Lock()
		room.Mutex.Unlock()
		// room.BroadcastEvent("DESELECT_ALL", nil)

	default:
		log.Println("Unknown operation type:", op.Type)
	}

	room.Mutex.Lock()
	room.RoomState.History = append(room.RoomState.History, op)
	historyIndex := len(room.RoomState.History) - 1

	if op.Type != types.SelectShape && op.Type != types.DeselectAll && op.Type != types.MultiSelectShapes {
		for i, user := range room.Users {
			if user.ID == userID {
				room.Users[i].UserState.UndoStack = append(room.Users[i].UserState.UndoStack, historyIndex)
				room.Users[i].UserState.RedoStack = []int{}
				break
			}
		}
	}
	room.Mutex.Unlock()
}

func (h *EventHandler) HandleUndo(data interface{}, room *types.Room, userID string) {
    room.Mutex.Lock()
    
	var userIndex int = -1
	for i, user := range room.Users {
		if user.ID == userID {
			userIndex = i
			break
		}
	}

	if userIndex == -1 {
		log.Println("User not found")
		room.Mutex.Unlock()
		return
	}

	undoStack := room.Users[userIndex].UserState.UndoStack
	if len(undoStack) == 0 {
		log.Println("No operations to undo")
		room.Mutex.Unlock()
		return
	}

	lastIndex := undoStack[len(undoStack)-1]
	room.Users[userIndex].UserState.UndoStack = undoStack[:len(undoStack)-1]
	room.Users[userIndex].UserState.RedoStack = append(room.Users[userIndex].UserState.RedoStack, lastIndex)

	op := room.RoomState.History[lastIndex]

	if op.Inverse == nil {
		log.Println("No inverse found for index:", lastIndex)
		room.Mutex.Unlock()
		return
	}

	inverse := op.Inverse

    applyOperationToRoomState(inverse, room, h.db, h.isPersistent)

	room.Mutex.Unlock()
	room.BroadcastEvent(inverse.Type.String(), inverse)
}

func (h *EventHandler) HandleRedo(data interface{}, room *types.Room, userID string) {
	room.Mutex.Lock()

	var userIndex int = -1
	for i, user := range room.Users {
		if user.ID == userID {
			userIndex = i
			break
		}
	}

	if userIndex == -1 {
		log.Println("User not found")
		room.Mutex.Unlock()
		return
	}

	redoStack := room.Users[userIndex].UserState.RedoStack
	if len(redoStack) == 0 {
		log.Println("User not found")
		room.Mutex.Unlock()
		return
	}

	lastIndex := redoStack[len(redoStack)-1]
	room.Users[userIndex].UserState.RedoStack = redoStack[:len(redoStack)-1]
	room.Users[userIndex].UserState.UndoStack = append(room.Users[userIndex].UserState.UndoStack, lastIndex)

	op := room.RoomState.History[lastIndex]

	applyOperationToRoomState(&op, room, h.db, h.isPersistent)

	room.Mutex.Unlock()
	room.BroadcastEvent(op.Type.String(), op)
}

func (h *EventHandler) HandleCursorMove(data interface{}, room *types.Room, userID string) {	
	b, err := json.Marshal(data)
	if err != nil {
		log.Println("Cursor unmarshal error:", err)
		return
	}

	var cursorEvent types.Cursor
	if err := json.Unmarshal(b, &cursorEvent); err != nil {
		log.Println("Cursor unmarshal error at start:", err)
		return
	}

	cursorEvent.Id = userID
	for _, user := range room.Users {
		if user.ID == userID {
			cursorEvent.Name = user.Name
			break
		}
	}

	room.BroadcastEventToOthers("cursor-receive", cursorEvent, userID)
}