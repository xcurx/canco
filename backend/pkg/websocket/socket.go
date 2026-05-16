package websocketPkg

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/xcurx/canco-backend/internal/auth"
	"github.com/xcurx/canco-backend/internal/config"
	"github.com/xcurx/canco-backend/internal/types"
)

func Connect(c *gin.Context) {
	cfg := config.Load()
	tokenString := c.Request.URL.Query().Get("token")

	userId, err := auth.ValidateToke(tokenString, cfg.AuthSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

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

	userID := room.AddUser(conn, userId)

	HandleEvents(conn, room, userID)

	defer func() {
		room.RemoveUser(userID)
		conn.Close()
		log.Println("WebSocket connection closed for canvas ID:", roomID)
	}()
}
