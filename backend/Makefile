.PHONY: start
start:
	go run ./cmd/main.go

.PHONY: dev
dev:
	go run ./cmd/main.go

.PHONY: server
server:
	go run ./cmd/main.go

.PHONY: sqlc
sqlc:
	cd internal/database && sqlc generate

.PHONY: migrate-up
migrate-up:
	goose -dir migrations postgres "your_dsn" up

.PHONY: migrate-down
migrate-down:
	goose -dir migrations postgres "your_dsn" down

.PHONY: migrate-create
migrate-create:
	goose -dir migrations create $(name) sql