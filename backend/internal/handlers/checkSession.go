package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/xcurx/canco-backend/internal/types"
)

func CheckSession(c *gin.Context) {
    roomId := c.Param("roomId")

	if (types.RoomExists(roomId)) {
		c.JSON(200, gin.H{
			"message": "room exists",
		})
	} else {
		c.JSON(404, gin.H{
			"message": "room does not exists",
		})
	}
}