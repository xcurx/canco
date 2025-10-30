package websocketPkg

import (
	"encoding/json"
	"log"

	"github.com/xcurx/canco-backend/internal/types"
)

func HandleOperation(data interface{}, room *types.Room) {
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
		createShape(op, room)

	case types.UpdateShape:
		updateShape(op, room)

	case types.DeleteShape:
		deleteShape(op, room)

	case types.SelectShape:
		room.Mutex.Lock()
		room.RoomState.Operations = append(room.RoomState.Operations, op)
		room.Mutex.Unlock()
		log.Printf("Shape selected: %+v", op.Data)
		// room.BroadcastEvent("SELECT_SHAPE", op.Data)

	case types.DeselectAll:
		room.Mutex.Lock()
		room.RoomState.Operations = append(room.RoomState.Operations, op)
		room.Mutex.Unlock()
		log.Println("All shapes deselected")
		// room.BroadcastEvent("DESELECT_ALL", nil)

	default:
		log.Println("Unknown operation type:", op.Type)
	}
}
	