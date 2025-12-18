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

	for i, user := range room.Users {
		if user.ID == userID {
			room.Users[i].UserState.Operation = append(room.Users[i].UserState.Operation, op)
			log.Println("Operations for user ", user.ID, " are: ", len(room.Users[i].UserState.Operation))
			break
		}
	}
}

func HandleUndo(data interface{}, room *types.Room, userID string) {
    room.Mutex.Lock()
	index := int(data.(float64))
	log.Println("Undoeing for user", userID, "with index", index)
	
	for i, user := range room.Users {
		if user.ID == userID {
			log.Println(user.UserState.Operation)
			operation := room.Users[i].UserState.Operation[index]
			room.Users[i].UserState.Operation = room.Users[i].UserState.Operation[:index]
			room.BroadcastEvent(operation.Type.String(), operation)
			break
		}
	}

    
    room.Mutex.Unlock()
}
	