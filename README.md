# Canco

Canco is a full-stack application featuring a Next.js frontend and a Go backend.

## Project Structure

This repository is a monorepo consisting of two main parts:

- `/frontend`: A modern Next.js 16 application using React 19, Tailwind CSS v4, Prisma (Postgres), NextAuth.js v5, and Radix UI components.
- `/backend`: A Go-based backend application designed to be containerized and deployed on Hugging Face Spaces using Docker.

## Features

- **Real-Time Collaboration**: Draw and brainstorm together with multiple users in real-time.
- **Infinite Canvas Workspace**: A fully interactive canvas with tools for freehand drawing, shapes, text, panning, and selection.
- **Dual Modes**: 
  - *Local Mode*: Start drawing immediately without an account.
  - *Cloud Mode*: Sign in to save, share, and collaborate on canvases.
- **Authentication**: Secure sign-in via NextAuth.js (Auth.js v5) with session management.
- **Persistent Storage**: All user data, sessions, and canvases are securely stored in a PostgreSQL database using Prisma ORM.
- **Access Control**: Support for public, private, and shared canvases with role-based visibility.

## Application Initialization Flow

1. **Landing Page (`/`)**
   - Unauthenticated users are greeted with a welcome screen and can choose to either **"Start Drawing Locally"** or **"Sign In to Save"**.
   - Authenticated users are automatically shown their **Dashboard**.

2. **Dashboard**
   - The user's saved canvases are fetched from the database via Prisma and displayed in a grid.
   - Users can create a **"+ New Canvas"**, which triggers a Next.js Server Action to create a new database record and redirects them to the new canvas room.

3. **Canvas Workspace (`/canvas/[roomId]`)**
   - The dynamic route securely checks if the user has permission to view the canvas (owner, shared, or public).
   - If authorized, the `CanvasClient` component mounts and initializes the drawing tools.
   - For collaborative canvases, a WebSocket connection is established with the Go backend (`/api/join/:canvasID`), using the user's session token for authentication.
   - The Go backend manages the WebSocket pool, broadcasting strokes, mouse movements, and state changes to all connected peers in real-time.

## Getting Started

### Prerequisites

- Node.js and pnpm (for the frontend)
- Go (for the backend)
- Docker (optional, for backend deployment)

### Frontend Development

The frontend is a Next.js application using the App Router.

```bash
cd frontend
pnpm install
pnpm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

For more detailed information, see the [Frontend README](./frontend/README.md).

### Backend Development

The backend is built with Go. 

```bash
cd backend
# Instructions for running the backend (e.g., using Make or go run)
make run # or go run ./...
```

For more detailed information, including Docker deployment instructions, see the [Backend README](./backend/README.md).

## Technologies Used

- **Frontend:**
  - Next.js 16
  - React 19
  - Tailwind CSS v4
  - Prisma (with PostgreSQL)
  - NextAuth.js v5
  - Radix UI Primitives

- **Backend:**
  - Go
  - Docker (for deployment)
