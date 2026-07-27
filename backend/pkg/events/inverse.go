package events

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/types"
)

// computes inverse of the given op for undoing
func ComputeInverse(op types.Operation, state types.RoomState) *types.Operation {
	switch op.Type {
	case types.CreateShape:
		return computeCreateInverse(op)
	case types.UpdateShape:
		return computeUpdateInverse(op, state)
	case types.DeleteShape:
		return computeDeleteInverse(op, state)
	case types.CreateShapes:
		return computeCreateShapesInverse(op)
	case types.UpdateShapes:
		return computeUpdateShapesInverse(op, state)
	case types.DeleteShapes:
		return computeDeleteShapesInverse(op, state)
	default:
		return nil
	}
}

func computeCreateInverse(op types.Operation) *types.Operation {
	data, ok := op.Data.(map[string]interface{})
	if !ok {
		return nil
	}

	shapeData, ok := data["shape"].(map[string]interface{})
	if !ok {
		return nil
	}

	shapeId, ok := shapeData["id"].(string)
	if !ok {
		return nil
	}

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.DeleteShape,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"id": shapeId,
		},
	}
}

func computeDeleteInverse(op types.Operation, state types.RoomState) *types.Operation {
	data, ok := op.Data.(map[string]interface{})
	if !ok {
		return nil
	}

	shapeId, ok := data["id"].(string)
	if !ok {
		return nil
	}

	var deletedShape *types.Shape
	for _, shape := range state.Shapes {
		if shape.ID == shapeId {
			deletedShape = &shape
			break
		}
	}

	if deletedShape == nil {
		return nil
	}

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.CreateShape,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"shape": deletedShape,
		},
	}
}

func computeUpdateInverse(op types.Operation, state types.RoomState) *types.Operation {
	data, ok := op.Data.(map[string]interface{})
	if !ok {
		return nil
	}

	shapeId, ok := data["id"].(string)
	if !ok {
		return nil
	}

	changes, ok := data["changes"].(map[string]interface{})
	if !ok {
		return nil
	}

	var currentShape *types.Shape
	for _, shape := range state.Shapes {
		if shape.ID == shapeId {
			currentShape = &shape
			break
		}
	}

	if currentShape == nil {
		return nil
	}

	inverseChanges := make(map[string]interface{})
	for key := range changes {
		switch key {
		case "x":
			inverseChanges["x"] = currentShape.X
		case "y":
			inverseChanges["y"] = currentShape.Y
		case "width":
			inverseChanges["width"] = currentShape.Width
		case "height":
			inverseChanges["height"] = currentShape.Height
		case "color":
			inverseChanges["color"] = currentShape.Color
		case "fillColor":
			inverseChanges["fillColor"] = currentShape.FillColor
		case "zIndex":
			inverseChanges["zIndex"] = currentShape.ZIndex
		case "rotation":
			inverseChanges["rotation"] = currentShape.Rotation
		case "strokeWidth":
			inverseChanges["strokeWidth"] = currentShape.StrokeWidth
		case "opacity":
			inverseChanges["opacity"] = currentShape.Opacity
		case "text":
			inverseChanges["text"] = currentShape.Text
		case "fontSize":
			inverseChanges["fontSize"] = currentShape.FontSize
		}
	}	

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.UpdateShape,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"id": shapeId,
			"changes": inverseChanges,
		},
	}
}

func computeCreateShapesInverse(op types.Operation) *types.Operation {
	data, ok := op.Data.(map[string]interface{})
	if !ok { return nil }

	var parsedData struct {
		Shapes []types.Shape `json:"shapes"`
	}
	bytes, _ := json.Marshal(data)
	json.Unmarshal(bytes, &parsedData)

	ids := make([]string, 0)
	for _, shape := range parsedData.Shapes {
		ids = append(ids, shape.ID)
	}

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.DeleteShapes,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"ids": ids,
		},
	}
}

func computeDeleteShapesInverse(op types.Operation, state types.RoomState) *types.Operation {
	data, ok := op.Data.(map[string]interface{})
	if !ok { return nil }

	var parsedData struct {
		IDs []string `json:"ids"`
	}
	bytes, _ := json.Marshal(data)
	json.Unmarshal(bytes, &parsedData)

	idMap := make(map[string]bool)
	for _, id := range parsedData.IDs {
		idMap[id] = true
	}

	deletedShapes := make([]types.Shape, 0)
	for _, shape := range state.Shapes {
		if idMap[shape.ID] {
			deletedShapes = append(deletedShapes, shape)
		}
	}

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.CreateShapes,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"shapes": deletedShapes,
		},
	}
}

func computeUpdateShapesInverse(op types.Operation, state types.RoomState) *types.Operation {
	data, ok := op.Data.(map[string]interface{})
	if !ok { return nil }

	var parsedData struct {
		Updates []struct {
			ID      string             `json:"id"`
			Changes types.PartialShape `json:"changes"`
		} `json:"updates"`
	}
	bytes, _ := json.Marshal(data)
	json.Unmarshal(bytes, &parsedData)

	shapeMap := make(map[string]*types.Shape)
	for i, shape := range state.Shapes {
		shapeMap[shape.ID] = &state.Shapes[i]
	}

	inverseUpdates := make([]map[string]interface{}, 0)

	for _, update := range parsedData.Updates {
		currentShape, exists := shapeMap[update.ID]
		if !exists { continue }

		changesBytes, _ := json.Marshal(update.Changes)
		var changes map[string]interface{}
		json.Unmarshal(changesBytes, &changes)

		inverseChanges := make(map[string]interface{})
		for key := range changes {
			switch key {
			case "x": inverseChanges["x"] = currentShape.X
			case "y": inverseChanges["y"] = currentShape.Y
			case "width": inverseChanges["width"] = currentShape.Width
			case "height": inverseChanges["height"] = currentShape.Height
			case "color": inverseChanges["color"] = currentShape.Color
			case "fillColor": inverseChanges["fillColor"] = currentShape.FillColor
			case "zIndex": inverseChanges["zIndex"] = currentShape.ZIndex
			case "rotation": inverseChanges["rotation"] = currentShape.Rotation
			case "strokeWidth": inverseChanges["strokeWidth"] = currentShape.StrokeWidth
			case "opacity": inverseChanges["opacity"] = currentShape.Opacity
			case "text": inverseChanges["text"] = currentShape.Text
			case "fontSize": inverseChanges["fontSize"] = currentShape.FontSize
			}
		}

		inverseUpdates = append(inverseUpdates, map[string]interface{}{
			"id": update.ID,
			"changes": inverseChanges,
		})
	}

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.UpdateShapes,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"updates": inverseUpdates,
		},
	}
}

func applyOperationToRoomState(op *types.Operation, room *types.Room, db *database.DB, isPersistent bool) {
	switch op.Type {
	case types.DeleteShape:
		data, ok := op.Data.(map[string]interface{})
		if !ok {
			return
		}

		shapeID, ok := data["id"].(string)
		if !ok {
			return
		}

		if isPersistent {
			go delete_shape(shapeID, room.ID, db)
		}

		for i, shape := range room.RoomState.Shapes {
			if shape.ID == shapeID {
				room.RoomState.Shapes = append(room.RoomState.Shapes[:i], room.RoomState.Shapes[i+1:]...)
				break
			}
		}

	case types.CreateShape:
		data, ok := op.Data.(map[string]interface{})
		if !ok {
			return
		}
		shapeData, ok := data["shape"].(map[string]interface{})
		if !ok {
			if shape, ok := data["shape"].(*types.Shape); ok {
				room.RoomState.Shapes = append(room.RoomState.Shapes, *shape)
			}
			return
		}

		shape := types.Shape{}
		if id, ok := shapeData["id"].(string); ok {
			shape.ID = id
		}
		if t, ok := shapeData["type"].(string); ok {
			shape.Type = t
		}
		if x, ok := shapeData["x"].(float64); ok {
			shape.X = float64(x)
		}
		if y, ok := shapeData["y"].(float64); ok {
			shape.Y = float64(y)
		}
		if w, ok := shapeData["width"].(float64); ok {
			shape.Width = float64(w)
		}
		if h, ok := shapeData["height"].(float64); ok {
			shape.Height = float64(h)
		}
		if c, ok := shapeData["color"].(string); ok {
			shape.Color = c
		}
		if fc, ok := shapeData["fillColor"].(string); ok {
			shape.FillColor = fc
		}
		if z, ok := shapeData["zIndex"].(float64); ok {
			shape.ZIndex = int(z)
		}
		if r, ok := shapeData["rotation"].(float64); ok {
			shape.Rotation = float64(r)
		}
		if sw, ok := shapeData["strokeWidth"].(float64); ok {
			shape.StrokeWidth = int(sw)
		}
		if o, ok := shapeData["opacity"].(float64); ok {
			shape.Opacity = o
		}
		if t, ok := shapeData["text"].(string); ok {
			shape.Text = t
		}
		if fs, ok := shapeData["fontSize"].(float64); ok {
			shape.FontSize = fs
		}

		if isPersistent {
			go create_shape(shape, room.ID, db)
		}
		room.RoomState.Shapes = append(room.RoomState.Shapes, shape)

	case types.UpdateShape:
		data, ok := op.Data.(map[string]interface{})
		if !ok {
			return
		}
		var parsedData struct {
			ID      string             `json:"id"`
			Changes types.PartialShape `json:"changes"`
		}
		bytes, _ := json.Marshal(data)
		json.Unmarshal(bytes, &parsedData)

		shapeID := parsedData.ID
		changes := parsedData.Changes
		if changes.ID == nil && shapeID != "" {
			changes.ID = &shapeID
		}

		if isPersistent {
			go update_shape(changes, room.ID, db)
		}
		
		for i, shape := range room.RoomState.Shapes {
			if shape.ID == shapeID {
				if changes.X != nil {
					room.RoomState.Shapes[i].X = *changes.X
				}
				if changes.Y != nil {
					room.RoomState.Shapes[i].Y = *changes.Y
				}
				if changes.Width != nil {
					room.RoomState.Shapes[i].Width = *changes.Width
				}
				if changes.Height != nil {
					room.RoomState.Shapes[i].Height = *changes.Height
				}
				if changes.Color != nil {
					room.RoomState.Shapes[i].Color = *changes.Color
				}
				if changes.ZIndex != nil {
					room.RoomState.Shapes[i].ZIndex = *changes.ZIndex
				}
				if changes.Rotation != nil {
					room.RoomState.Shapes[i].Rotation = *changes.Rotation
				}
				if changes.StrokeWidth != nil {
					room.RoomState.Shapes[i].StrokeWidth = *changes.StrokeWidth
				}
				if changes.Opacity != nil {
					room.RoomState.Shapes[i].Opacity = *changes.Opacity
				}
				if changes.Text != nil {
					room.RoomState.Shapes[i].Text = *changes.Text
				}
				if changes.FontSize != nil {
					room.RoomState.Shapes[i].FontSize = *changes.FontSize
				}
				if changes.FillColor != nil {
					room.RoomState.Shapes[i].FillColor = *changes.FillColor
				}
				break
			}
		}
		
	case types.CreateShapes:
		data, ok := op.Data.(map[string]interface{})
		if !ok { return }
		var parsedData struct { Shapes []types.Shape `json:"shapes"` }
		bytes, _ := json.Marshal(data)
		json.Unmarshal(bytes, &parsedData)
		if isPersistent {
			for _, s := range parsedData.Shapes { go create_shape(s, room.ID, db) }
		}
		room.RoomState.Shapes = append(room.RoomState.Shapes, parsedData.Shapes...)

	case types.UpdateShapes:
		data, ok := op.Data.(map[string]interface{})
		if !ok { return }
		var parsedData struct {
			Updates []struct {
				ID      string             `json:"id"`
				Changes types.PartialShape `json:"changes"`
			} `json:"updates"`
		}
		bytes, _ := json.Marshal(data)
		json.Unmarshal(bytes, &parsedData)

		for _, update := range parsedData.Updates {
			if update.Changes.ID == nil && update.ID != "" { update.Changes.ID = &update.ID }
			if isPersistent { go update_shape(update.Changes, room.ID, db) }
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

	case types.DeleteShapes:
		data, ok := op.Data.(map[string]interface{})
		if !ok { return }
		var parsedData struct { IDs []string `json:"ids"` }
		bytes, _ := json.Marshal(data)
		json.Unmarshal(bytes, &parsedData)

		idMap := make(map[string]bool)
		for _, id := range parsedData.IDs {
			idMap[id] = true
			if isPersistent { go delete_shape(id, room.ID, db) }
		}
		newShapes := make([]types.Shape, 0)
		for _, shape := range room.RoomState.Shapes {
			if !idMap[shape.ID] { newShapes = append(newShapes, shape) }
		}
		room.RoomState.Shapes = newShapes
	}
}
    