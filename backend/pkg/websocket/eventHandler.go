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
		log.Println(event)

		switch event.Type {
		case "operation":
			log.Println("Handling operation event")
			eventHandler.HandleOperation(event.Data, room, userID)

		case "undo": 
			log.Println("Handling undo event")
			eventHandler.HandleUndo(event.Data, room, userID)

		case "redo":
			log.Println("Handling redo event")
			eventHandler.HandleRedo(event.Data, room, userID)
		}
	}
}