package events

import (
	"encoding/json"
	"log"

	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/types"
)

func createShape(op types.Operation, room *types.Room, userID string, db *database.DB, isPersistent bool) {
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

	dataMap, ok := unmarshalledOPData.(map[string]interface{})
	if !ok {
		log.Println("Invalid data map after unmarshalling")
		return
	}
	// The shape is nested inside data.shape
	shapeObj, ok := dataMap["shape"].(map[string]interface{})
	if !ok {
		log.Println("Invalid shape data - 'shape' key not found or wrong type")
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

	if isPersistent { 
		go create_shape(shape, room.ID, db) 
	}

	room.Mutex.Lock()
	room.RoomState.Shapes = append(room.RoomState.Shapes, shape)
	room.Mutex.Unlock()
	log.Printf("Shape created: %+v", shape)
	room.BroadcastEvent("CREATE_SHAPE", op)
}

func updateShape(op types.Operation, room *types.Room, userID string, db *database.DB, isPersistent bool) {
	log.Println("The user id is: ", userID)
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
		Changes types.PartialShape `json:"changes"`
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
	changesBytes, err := json.Marshal(data.Changes)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}
	if err := json.Unmarshal(changesBytes, &changes); err != nil {
		log.Println("Unmarshal error at update shape changes:", err)
		return
	}

	if changes.ID == nil && data.ID != "" {
		changes.ID = &data.ID
	}

	if isPersistent {
		go update_shape(changes, room.ID, db)
	}

	shapeId := data.ID

	room.Mutex.Lock()

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
			if changes.FillColor != nil {
				shape.FillColor = *changes.FillColor
			}
			if changes.ZIndex != nil {
				shape.ZIndex = *changes.ZIndex
			}
			if changes.Rotation != nil {
                shape.Rotation = *changes.Rotation
			}
			if changes.StrokeWidth != nil {
				shape.StrokeWidth = *changes.StrokeWidth
			}
			if changes.Opacity != nil {
				shape.Opacity = *changes.Opacity
			}
			if changes.Text != nil {
				shape.Text = *changes.Text
			}
			if changes.FontSize != nil {
				shape.FontSize = *changes.FontSize
			}
			room.RoomState.Shapes[i] = shape
			break
		}
	}

	room.Mutex.Unlock()
	log.Printf("Shape updated: %+v", op.Data)
	room.BroadcastEvent("UPDATE_SHAPE", op)
}

func deleteShape(op types.Operation, room *types.Room, userID string, db *database.DB, isPersistent bool) {
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

	if isPersistent {
		go delete_shape(shapeId, room.ID, db)
	}

	room.Mutex.Lock()
 
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

func createShapes(op types.Operation, room *types.Room, userID string, db *database.DB, isPersistent bool) {
	operationData, ok := op.Data.(map[string]interface{})
	if !ok { return }

	var data struct {
		Shapes []types.Shape `json:"shapes"`
	}
	bytes, _ := json.Marshal(operationData)
	json.Unmarshal(bytes, &data)

	if isPersistent {
		for _, s := range data.Shapes {
			go create_shape(s, room.ID, db)
		}
	}

	room.Mutex.Lock()
	room.RoomState.Shapes = append(room.RoomState.Shapes, data.Shapes...)
	room.Mutex.Unlock()
	log.Printf("Shapes created: %d", len(data.Shapes))
	room.BroadcastEvent("CREATE_SHAPES", op)
}

func updateShapes(op types.Operation, room *types.Room, userID string, db *database.DB, isPersistent bool) {
	operationData, ok := op.Data.(map[string]interface{})
	if !ok { return }

	var data struct {
		Updates []struct {
			ID      string             `json:"id"`
			Changes types.PartialShape `json:"changes"`
		} `json:"updates"`
	}
	bytes, _ := json.Marshal(operationData)
	json.Unmarshal(bytes, &data)

	room.Mutex.Lock()
	for _, update := range data.Updates {
		if update.Changes.ID == nil && update.ID != "" {
			update.Changes.ID = &update.ID
		}
		if isPersistent {
			go update_shape(update.Changes, room.ID, db)
		}

		for i, shape := range room.RoomState.Shapes {
			if shape.ID == update.ID {
				if update.Changes.X != nil { room.RoomState.Shapes[i].X = *update.Changes.X }
				if update.Changes.Y != nil { room.RoomState.Shapes[i].Y = *update.Changes.Y }
				if update.Changes.Width != nil { room.RoomState.Shapes[i].Width = *update.Changes.Width }
				if update.Changes.Height != nil { room.RoomState.Shapes[i].Height = *update.Changes.Height }
				if update.Changes.Color != nil { room.RoomState.Shapes[i].Color = *update.Changes.Color }
				if update.Changes.FillColor != nil { room.RoomState.Shapes[i].FillColor = *update.Changes.FillColor }
				if update.Changes.ZIndex != nil { room.RoomState.Shapes[i].ZIndex = *update.Changes.ZIndex }
				if update.Changes.Rotation != nil { room.RoomState.Shapes[i].Rotation = *update.Changes.Rotation }
				if update.Changes.StrokeWidth != nil { room.RoomState.Shapes[i].StrokeWidth = *update.Changes.StrokeWidth }
				if update.Changes.Opacity != nil { room.RoomState.Shapes[i].Opacity = *update.Changes.Opacity }
				if update.Changes.Text != nil { room.RoomState.Shapes[i].Text = *update.Changes.Text }
				if update.Changes.FontSize != nil { room.RoomState.Shapes[i].FontSize = *update.Changes.FontSize }
				break
			}
		}
	}
	room.Mutex.Unlock()
	log.Printf("Shapes updated: %d", len(data.Updates))
	room.BroadcastEvent("UPDATE_SHAPES", op)
}

func deleteShapes(op types.Operation, room *types.Room, userID string, db *database.DB, isPersistent bool) {
	operationData, ok := op.Data.(map[string]interface{})
	if !ok { return }

	var data struct {
		IDs []string `json:"ids"`
	}
	bytes, _ := json.Marshal(operationData)
	json.Unmarshal(bytes, &data)

	idMap := make(map[string]bool)
	for _, id := range data.IDs {
		idMap[id] = true
		if isPersistent {
			go delete_shape(id, room.ID, db)
		}
	}

	room.Mutex.Lock()
	newShapes := make([]types.Shape, 0)
	for _, shape := range room.RoomState.Shapes {
		if !idMap[shape.ID] {
			newShapes = append(newShapes, shape)
		}
	}
	room.RoomState.Shapes = newShapes
	room.Mutex.Unlock()
	log.Printf("Shapes deleted: %d", len(data.IDs))
	room.BroadcastEvent("DELETE_SHAPES", op)
}