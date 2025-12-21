package websocketPkg

import (
	"encoding/json"
	"log"

	"github.com/xcurx/canco-backend/internal/types"
)

func HandleOperation(data interface{}, room *types.Room, userID string) {
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
		createShape(op, room, userID)

	case types.UpdateShape:
		updateShape(op, room, userID)

	case types.DeleteShape:
		deleteShape(op, room, userID)

	case types.SelectShape:
		room.Mutex.Lock()
		room.Mutex.Unlock()
		log.Printf("Shape selected: %+v", op.Data)
		// room.BroadcastEvent("SELECT_SHAPE", op.Data)

	case types.DeselectAll:
		room.Mutex.Lock()
		room.Mutex.Unlock()
		log.Println("All shapes deselected")
		// room.BroadcastEvent("DESELECT_ALL", nil)

	default:
		log.Println("Unknown operation type:", op.Type)
	}

	room.Mutex.Lock()
	room.RoomState.History = append(room.RoomState.History, op)
	historyIndex := len(room.RoomState.History) - 1

	if op.Type != types.SelectShape && op.Type != types.DeselectAll {
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

func HandleUndo(data interface{}, room *types.Room, userID string) {
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

	log.Printf("UndoStack was: %v, popped index: %d, history length: %d", undoStack, lastIndex, len(room.RoomState.History))

	op := room.RoomState.History[lastIndex]

	log.Printf("Operation at index %d: type=%s, data=%+v, inverse data=%+v", lastIndex, op.Type.String(), op.Data, op.Inverse.Data)

	if op.Inverse == nil {
		log.Println("No inverse found for index:", lastIndex)
		room.Mutex.Unlock()
		return
	}

	inverse := op.Inverse
	log.Printf("Undoing with inverse: %s, data: %+v", inverse.Type.String(), inverse.Data)

    applyInverseToRoomState(inverse, room)

	room.Mutex.Unlock()
	room.BroadcastEvent(inverse.Type.String(), inverse)
}
	