package server

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xcurx/canco-backend/internal/database"
	"github.com/xcurx/canco-backend/internal/handlers"
	"github.com/xcurx/canco-backend/pkg/websocket"
)

func InitializeServer(db *database.DB) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
			AllowOrigins: []string{"*"},
			AllowMethods: []string{"GET", "POST", "PUT", "DELETE","OPTIONS"},
			AllowHeaders: []string{"Accept", "Content-Type", "Accept"},
			AllowCredentials: true,
			MaxAge: 300,
	}))

	wsHandler := websocketPkg.New(db)

    r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := r.Group("/api")
	{
		api.POST("/createRoom", handlers.CreateRoom)
		api.GET("/join/:canvasID", wsHandler.Connect)
	}
	return r
}