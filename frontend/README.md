# Canco Frontend

This is the Next.js frontend for the Canco collaborative drawing application.

## Technologies Used

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript & React 19
- **Styling**: Tailwind CSS v4 & Radix UI Primitives
- **Authentication**: NextAuth.js (Auth.js v5)
- **Database ORM**: Prisma (PostgreSQL)

## Features

- **Interactive Canvas Engine**: A custom built rendering and interaction system for drawing shapes, freehand strokes, and text.
- **Real-Time Sync**: Connects to the Go backend via WebSockets to synchronize drawing events in real-time.
- **Local & Cloud Modes**: Use the canvas locally without an account, or sign in via OAuth to persist canvases to the database.
- **Dashboard**: A user interface for authenticated users to manage their saved canvases.

## Initialization Flow

1. **Routing & Authentication**: Next.js handles routing. The homepage (`/`) checks user sessions. Unauthenticated users see a landing page, while authenticated users see their dashboard.
2. **Canvas Mounting**: When navigating to `/canvas/[roomId]`, the `CanvasClient` component initializes. It fetches the canvas state and sets up event listeners.
3. **WebSocket Connection**: If it's a persistent canvas, a WebSocket connection is established with the Go backend, passing the user's session token for validation.
4. **Rendering Loop**: The HTML5 canvas context is continuously updated with local actions and remote events received via the WebSocket.

## Local Development

First, make sure you have `pnpm` and Node.js installed.

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Environment Setup:**
   Create a `.env` file in this directory with the following variables (adjust based on your setup):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/canco"
   AUTH_SECRET="your-secret"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   NEXT_PUBLIC_WS_URL="ws://localhost:7860" # URL to your Go backend
   ```

3. **Database Setup:**
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev
   ```

4. **Run the Development Server:**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
