package config

import (
	"log"
	"os"
)

type Config struct {
	AuthSecret  string
	Port        string
	DatabaseURL string
}

func Load() *Config {
	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		log.Fatal("AUTH_SECRET env var is not set") 
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL env var is not set")
	}

	return &Config{
		AuthSecret: secret,
		Port: port,
		DatabaseURL: dbUrl,
	}
}