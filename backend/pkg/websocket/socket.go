package websocket

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/xcurx/canco-backend/internal/types"
)

func Connect(c *gin.Context) {
	roomID := c.Param("roomID")

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Print("Upgrade error:", err)
		return
	}
	log.Println("New WebSocket connection for canvas ID:", roomID)

	roomManager := types.GetRoomManager()
	room := roomManager.GetOrCreateRoom(roomID)
	log.Printf("Room ID: %s, Title: %s", room.ID, room.Title)

	room.AddUser(conn)
}