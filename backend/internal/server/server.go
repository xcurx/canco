package server

import (
	"github.com/xcurx/canco-backend/internal/types"
)

func Start() {
	var ot = types.CreateShape
	println(ot)
	r := InitializeServer()

	err := r.Run() // listen and serve on
	if err != nil {
		panic(err)
	}
}