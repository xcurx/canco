# Build stage
FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/main.go

# Final stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server .

# 7860 for hf spaces
ENV PORT=7860
EXPOSE 7860

CMD ["/app/server"]
