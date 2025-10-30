package websocketPkg

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
	"github.com/xcurx/canco-backend/internal/types"
)


func HandleEvents(conn *websocket.Conn, room *types.Room) {
	log.Println("Starting event handler for room ID:", room.ID)
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
			HandleOperation(event.Data, room)
		}
	}
}