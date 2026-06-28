---
title: Canco Backend
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Canco Backend

This is the Go backend for the Canco collaborative drawing application.

## Features

- **WebSocket Server**: Manages real-time connections with frontend clients.
- **Room Management**: Handles creation and lifecycle of collaborative canvas rooms.
- **Event Broadcasting**: Syncs drawing strokes, shapes, text, and user presence across all clients in a room.
- **Session Validation**: Integrates with NextAuth session tokens (via PostgreSQL) to authenticate users securely before they join a collaborative session.

## Application Initialization Flow

1. The server starts and loads configuration from environment variables (`.env`).
2. It initializes the database connection (PostgreSQL via `database.DB`) and the WebSocket handler pool.
3. The Gin router sets up CORS (to allow requests from the Next.js frontend) and registers API endpoints:
   - `/api/createRoom`: Initializes a new WebSocket session room.
   - `/api/join/:canvasID`: The main WebSocket endpoint for clients to connect to a specific canvas.
   - `/api/check-session/:roomId`: Verifies user session validity.

## Local Development

1. Ensure Go (1.22+) is installed.
2. Clone the repository and navigate to the `backend` directory.
3. Create a `.env` file based on your local database credentials (or rely on system env vars).
4. Run the server:
   ```bash
   make run
   # or
   go run cmd/main.go
   ```

## Deployment (Hugging Face Spaces)

This backend is designed to be containerized and deployed on Hugging Face Spaces using Docker. The deployment configuration is defined in the `Dockerfile` and the metadata block at the top of this file.

- **App Port**: The server runs on port `7860`, which is the default for Hugging Face Docker spaces.
- **SDK**: Configured to use `docker` as the Space SDK.
