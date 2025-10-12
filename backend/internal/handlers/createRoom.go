package handlers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/xcurx/canco-backend/internal/types"
)

func CreateRoom(c *gin.Context) {
    roomID := c.Param("roomID")
    log.Print("Creating room with ID: ", roomID)

	roomManager := types.GetRoomManager()
	room := roomManager.GetOrCreateRoom(roomID)
	log.Printf("Room created: %+v", room)

	c.JSON(200, gin.H{
		"message": "Room created",
		"roomID":  room.ID,
	})
}