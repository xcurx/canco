package websocketPkg

import (
	"time"

	"github.com/google/uuid"
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
	case types.SelectShape:
		return computeSelectInverse(op, state)
	case types.DeselectAll:
		return computeDeselectAllInverse(state)
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
		case "isSelected":
			inverseChanges["isSelected"] = currentShape.IsSelected
		case "zIndex":
			inverseChanges["zIndex"] = currentShape.ZIndex
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

func computeSelectInverse(op types.Operation, state types.RoomState) *types.Operation {
	var previouslySelected string
	for _, shape := range state.Shapes {
		if shape.IsSelected {
			previouslySelected = shape.ID
			break
		}
	}

	if previouslySelected == "" {
		return &types.Operation{
			ID:        uuid.New().String(),
			Type:      types.DeselectAll,
			Timestamp: time.Now().UnixMilli(),
			Data: map[string]interface{}{},
		}
	}

	return &types.Operation{
		ID:        uuid.New().String(),
		Type:      types.SelectShape,
		Timestamp: time.Now().UnixMilli(),
		Data: map[string]interface{}{
			"id": previouslySelected,
		},
	}
}

func computeDeselectAllInverse(state types.RoomState) *types.Operation {
    var selectedID string
    for _, shape := range state.Shapes {
        if shape.IsSelected {
            selectedID = shape.ID
            break
        }
    }

    if selectedID == "" {
        return nil
    }

    return &types.Operation{
        ID:        uuid.New().String(),
        Type:      types.SelectShape,
        Timestamp: time.Now().UnixMilli(),
        Data: map[string]interface{}{
            "id": selectedID,
        },
    }
}

func applyOperationToRoomState(op *types.Operation, room *types.Room) {
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
			shape.X = int(x)
		}
		if y, ok := shapeData["y"].(float64); ok {
			shape.Y = int(y)
		}
		if w, ok := shapeData["width"].(float64); ok {
			shape.Width = int(w)
		}
		if h, ok := shapeData["height"].(float64); ok {
			shape.Height = int(h)
		}
		if c, ok := shapeData["color"].(string); ok {
			shape.Color = c
		}
		if z, ok := shapeData["zIndex"].(float64); ok {
			shape.ZIndex = int(z)
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
		changes, ok := data["changes"].(map[string]interface{})
		if !ok {
			return
		}
		for i, shape := range room.RoomState.Shapes {
			if shape.ID == shapeID {
				if x, ok := changes["x"].(float64); ok {
					room.RoomState.Shapes[i].X = int(x)
				}
				if y, ok := changes["y"].(float64); ok {
					room.RoomState.Shapes[i].Y = int(y)
				}
				if w, ok := changes["width"].(float64); ok {
					room.RoomState.Shapes[i].Width = int(w)
				}
				if h, ok := changes["height"].(float64); ok {
					room.RoomState.Shapes[i].Height = int(h)
				}
				break
			}
		}
	}
}
    