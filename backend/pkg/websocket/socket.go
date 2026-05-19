package websocketPkg

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/xcurx/canco-backend/internal/auth"
	"github.com/xcurx/canco-backend/internal/config"
	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/types"
)

type Handler struct {
	db *database.DB
}

func New(db *database.DB) *Handler {
    return &Handler{db: db}
}

func (h *Handler) Connect(c *gin.Context) {
	cfg := config.Load()
	tokenString := c.Query("token")
	var userId string
	var err error
	var isPersistent bool

	// if a token is provided try to authenticate
	if tokenString != "" {
		userId, err = auth.ValidateToken(tokenString, cfg.AuthSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		isPersistent = true
	} else {
		// no token means its a local connection
		userId = "guest_" + c.ClientIP()
		isPersistent = false
	}

	roomID := c.Param("canvasID")

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
	room := roomManager.GetOrCreateRoom(roomID, isPersistent, h.db)
	log.Printf("Room ID: %s, Title: %s, Persistent: %v", room.ID, room.Title, isPersistent)

	userID := room.AddUser(conn, userId)

	HandleEvents(conn, room, userID, h.db, isPersistent)

	defer func() {
		room.RemoveUser(userID)
		conn.Close()
		log.Println("WebSocket connection closed for canvas ID:", roomID)
	}()
}
