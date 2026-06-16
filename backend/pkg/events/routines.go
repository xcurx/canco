package events

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/database/sqlc"
	"github.com/xcurx/canco-backend/internal/types"
)

func create_shape(shape types.Shape, roomId string, db *database.DB) {
	err := db.Queries.UpsertShape(context.Background(), sqlc.UpsertShapeParams{
	    ID: shape.ID,
		Type: shape.Type,
		X: float64(shape.X),
		Y: float64(shape.Y),
		Width: float64(shape.Width),
		Height: float64(shape.Height),
		Color: shape.Color,
		ZIndex: int32(shape.ZIndex),
		Text: pgtype.Text{String: shape.Text, Valid: shape.Text != ""},
		FontSize: pgtype.Float8{Float64: shape.FontSize, Valid: shape.FontSize > 0},
		CanvasId: roomId,
	})
	if (err != nil) {
		log.Printf("Failed to save shape to db: %v", err)
	}
}

func update_shape(changes types.PartialShape, roomId string, db *database.DB) {
	ctx := context.Background()
	if changes.ID == nil {
		log.Printf("Cannot update shape: ID is nil")
		return
	}
	existing, err := db.Queries.GetShape(ctx, *changes.ID)
	if err != nil {
		return
	}

	if changes.X != nil { existing.X = float64(*changes.X) }
	if changes.Y != nil { existing.Y = float64(*changes.Y) }
	if changes.Width != nil  { existing.Width  = float64(*changes.Width)  }
	if changes.Height != nil { existing.Height = float64(*changes.Height) }
	if changes.Color != nil  { existing.Color  = *changes.Color  }
	if changes.ZIndex != nil { existing.ZIndex = int32(*changes.ZIndex) }
	if changes.Text != nil   { existing.Text = pgtype.Text{String: *changes.Text, Valid: *changes.Text != ""} }
	if changes.FontSize != nil { existing.FontSize = pgtype.Float8{Float64: *changes.FontSize, Valid: *changes.FontSize > 0} }

	err = db.Queries.UpsertShape(ctx, sqlc.UpsertShapeParams{
		ID:       existing.ID,
		Type:     existing.Type,
		X:        existing.X,
		Y:        existing.Y,
		Width:    existing.Width,
		Height:   existing.Height,
		Color:    existing.Color,
		ZIndex:   existing.ZIndex,
		Text:     existing.Text,
		FontSize: existing.FontSize,
		CanvasId: roomId,
	})
	if err != nil {
		log.Printf("Failed to update shape: %v", err)
	}
}

func delete_shape(shapeId string, roomId string, db *database.DB) {
	err := db.Queries.DeleteShape(context.Background(), sqlc.DeleteShapeParams{
		ID: shapeId,
		CanvasId: roomId,
	})
	if err != nil {
		log.Printf("Failed to delete shape: %v", err)
	}
}