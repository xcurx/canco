package server

import (
	"github.com/xcurx/canco-backend/internal/config"
	"github.com/xcurx/canco-backend/internal/database"
)

func Start() {
	db := database.Init()
	r := InitializeServer(db)

	cfg := config.Load()
	err := r.Run("0.0.0.0:" + cfg.Port) // listen and serve on
	if err != nil {
		panic(err)
	}
}