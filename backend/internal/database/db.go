package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xcurx/canco-backend/internal/config"
	"github.com/xcurx/canco-backend/internal/database/sqlc"
)

type DB struct {
	Pool    *pgxpool.Pool
	Queries *sqlc.Queries
}

func Init() *DB {
	cfg := config.Load()
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}

	return &DB{
        Pool: pool,
		Queries: sqlc.New(pool),
	}
}

func ToPgFloat8(v *float64) pgtype.Float8 {
    if v == nil {
        return pgtype.Float8{Valid: false}
    }
    return pgtype.Float8{Float64: *v, Valid: true}
}

func ToPgText(v *string) pgtype.Text {
    if v == nil {
        return pgtype.Text{Valid: false}
    }
    return pgtype.Text{String: *v, Valid: true}
}

func ToPgInt4(v *int32) pgtype.Int4 {
    if v == nil {
        return pgtype.Int4{Valid: false}
    }
    return pgtype.Int4{Int32: *v, Valid: true}
}
