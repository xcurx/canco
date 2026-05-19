package server

import "github.com/xcurx/canco-backend/internal/database"

func Start() {
	db := database.Init()
	r := InitializeServer(db)

	err := r.Run() // listen and serve on
	if err != nil {
		panic(err)
	}
}