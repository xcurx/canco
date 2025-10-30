package websocketPkg

import (
	"encoding/json"
	"log"

	"github.com/xcurx/canco-backend/internal/types"
)

func createShape(op types.Operation, room *types.Room) {
	operationData, ok := op.Data.(map[string]interface{})
	if !ok {
		log.Println("Invalid shape data")
		return
	}
	operationDataBytes, err := json.Marshal(operationData)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	var unmarshalledOPData interface{}
	if err := json.Unmarshal(operationDataBytes, &unmarshalledOPData); err != nil {
		log.Println("Unmarshal error in create shape:", err)
		return
	}

	shapeObj, ok := unmarshalledOPData.(map[string]interface{})
	if !ok {
		log.Println("Invalid shape data after unmarshalling")
		return
	}

	shapeBytes, err := json.Marshal(shapeObj)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	var shape types.Shape
	if err := json.Unmarshal(shapeBytes, &shape); err != nil {
		log.Println("Unmarshal error at create shape:", err)
		return
	}

	room.Mutex.Lock()
	room.RoomState.Operations = append(room.RoomState.Operations, op)
	room.RoomState.Shapes = append(room.RoomState.Shapes, shape)
	room.Mutex.Unlock()
	log.Printf("Shape created: %+v", shape)
	room.BroadcastEvent("CREATE_SHAPE", op)
}

func updateShape(op types.Operation, room *types.Room) {
	operationData, ok := op.Data.(map[string]interface{})
	if !ok {
		log.Println("Invalid shape data")
		return
	}
	operationDataBytes, err := json.Marshal(operationData)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	var unmarshalledOPData interface{}
	if err := json.Unmarshal(operationDataBytes, &unmarshalledOPData); err != nil {
		log.Println("Unmarshal error in create shape:", err)
		return
	}

	type opData struct {
		ID    string             `json:"id"`
		Shape types.PartialShape `json:"shape"`
	}

	var data opData
	dataBytes, err := json.Marshal(unmarshalledOPData)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	if err := json.Unmarshal(dataBytes, &data); err != nil {
		log.Println("Unmarshal error at update shape:", err)
		return
	}

	var changes types.PartialShape
	changesBytes, err := json.Marshal(data.Shape)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	if err := json.Unmarshal(changesBytes, &changes); err != nil {
		log.Println("Unmarshal error at update shape changes:", err)
		return
	}

	shapeId := data.ID

	room.Mutex.Lock()
	room.RoomState.Operations = append(room.RoomState.Operations, op)
	for i, shape := range room.RoomState.Shapes {
		if shape.ID == shapeId {
			if changes.X != nil {
				shape.X = *changes.X
			}
			if changes.Y != nil {
				shape.Y = *changes.Y
			}
			if changes.Width != nil {
				shape.Width = *changes.Width
			}
			if changes.Height != nil {
				shape.Height = *changes.Height
			}
			if changes.Color != nil {
				shape.Color = *changes.Color
			}
			shape.IsSelected = *changes.IsSelected
			room.RoomState.Shapes[i] = shape
			break
		}
	}
	room.Mutex.Unlock()
	log.Printf("Shape updated: %+v", op.Data)
	room.BroadcastEvent("UPDATE_SHAPE", op)
}

func deleteShape(op types.Operation, room *types.Room) {
    operationData, ok := op.Data.(map[string]interface{})
	if !ok {
		log.Println("Invalid shape data")
		return
	}
	operationDataBytes, err := json.Marshal(operationData)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	var unmarshalledOPData interface{}
	if err := json.Unmarshal(operationDataBytes, &unmarshalledOPData); err != nil {
		log.Println("Unmarshal error in create shape:", err)
		return
	}

	shapeId := unmarshalledOPData.(map[string]interface{})["id"].(string)

	room.Mutex.Lock()
	room.RoomState.Operations = append(room.RoomState.Operations, op)
	for i, shape := range room.RoomState.Shapes {
		if shape.ID == shapeId {
			room.RoomState.Shapes = append(room.RoomState.Shapes[:i], room.RoomState.Shapes[i+1:]...)
			break
		}
	}
	room.Mutex.Unlock()
	log.Printf("Shape deleted: %+v", op.Data)
	room.BroadcastEvent("DELETE_SHAPE", op)
}