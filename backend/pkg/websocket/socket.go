package websocketPkg

import (
	"log"
	"net/http"
	"time"

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

	userID := room.AddUser(conn)

	HandleEvents(conn, room, userID);

	go func() {
		for {
		    room.Mutex.RLock()
			for _, user := range room.Users {
				if user.ID == userID {
					log.Println(user.UserState.Operation)
				}
			}
			room.Mutex.RUnlock()
			time.Sleep(time.Second*2)
		}
	}()

	defer func() {
		// room.RemoveUser()
		conn.Close()
		log.Println("WebSocket connection closed for canvas ID:", roomID)
	}()
}