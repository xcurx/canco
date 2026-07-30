package websocketPkg

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/types"
	"github.com/xcurx/canco-backend/pkg/events"
)

func HandleEvents(conn *websocket.Conn, room *types.Room, userID string, db *database.DB, isPersistent bool) {
	log.Println("Starting event handler for room ID:", room.ID)
	eventHandler := events.New(db, isPersistent)
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			return
		}

		var event types.Event
		if err := json.Unmarshal(message, &event); err != nil {
			log.Println("Unmarshal error at beginning:", err)
			continue
		}

		switch event.Type {
		case "operation":
			eventHandler.HandleOperation(event.Data, room, userID)

		case "undo": 
			eventHandler.HandleUndo(event.Data, room, userID)

		case "redo":
			eventHandler.HandleRedo(event.Data, room, userID)

		case "cursor-send":
			eventHandler.HandleCursorMove(event.Data, room, userID)
		}
	}
}