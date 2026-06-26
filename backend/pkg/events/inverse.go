package events

import (
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
		case "zIndex":
			inverseChanges["zIndex"] = currentShape.ZIndex
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
		if z, ok := shapeData["zIndex"].(float64); ok {
			shape.ZIndex = int(z)
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
		shapeID, ok := data["id"].(string)
		if !ok {
			return
		}
		changes, ok := data["changes"].(types.PartialShape)
		if !ok {
			return
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
				if changes.Text != nil {
					room.RoomState.Shapes[i].Text = *changes.Text
				}
				if changes.FontSize != nil {
					room.RoomState.Shapes[i].FontSize = *changes.FontSize
				}
				break
			}
		}
	}
}
    