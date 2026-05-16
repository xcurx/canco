package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/xcurx/canco-backend/internal/server"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env found, using system env vars")
	}
	server.Start()
}
