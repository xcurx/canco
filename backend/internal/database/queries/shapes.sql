-- name: GetShape :one
SELECT id, type, x, y, width, height, color, "zIndex", "rotation", "text", "fontSize", "canvasId", "updatedAt"
FROM "Shape"
WHERE id = $1;

-- name: UpsertShape :exec
INSERT INTO "Shape" (id, type, x, y, width, height, color, "zIndex", "text", "fontSize", "canvasId", "updatedAt") 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
ON CONFLICT (id) DO UPDATE 
SET type = EXCLUDED.type,
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    width = EXCLUDED.width,
    height = EXCLUDED.height,
    color = EXCLUDED.color,
    "zIndex" = EXCLUDED."zIndex",
    "rotation" = EXCLUDED."rotation",
    "text" = EXCLUDED."text",
    "fontSize" = EXCLUDED."fontSize",
    "canvasId" = EXCLUDED."canvasId",
    "updatedAt" = NOW();

-- name: DeleteShape :exec
DELETE FROM "Shape" WHERE id = $1 AND "canvasId" = $2;

-- name: GetShapesByCanvasId :many
SELECT id, type, x, y, width, height, color, "zIndex", "rotation", "text", "fontSize", "canvasId", "updatedAt"
FROM "Shape"
WHERE "canvasId" = $1;