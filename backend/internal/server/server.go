package server

func Start() {
	r := InitializeServer()

	err := r.Run() // listen and serve on
	if err != nil {
		panic(err)
	}
}