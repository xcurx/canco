package websocket

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func Connect(c *gin.Context) {
	canvasID := c.Param("canvasID")

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	_, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Print("Upgrade error:", err)
		return
	}
	log.Println("New WebSocket connection for canvas ID:", canvasID)
}