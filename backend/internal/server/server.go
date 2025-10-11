package server

func Initialize() {
	r := InitializeServer()

	r.Run() // listen and serve on
}