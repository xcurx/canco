-- name: CheckCanvasAccess :one
SELECT EXISTS (
    SELECT 1 FROM "Canvas" 
    WHERE "Canvas".id = $1 
    AND (
        "Canvas"."userId" = $2 
        OR visibility = 'PUBLIC'
        OR EXISTS (
            SELECT 1 FROM "CanvasShare" 
            WHERE "CanvasShare"."canvasId" = "Canvas".id 
            AND "CanvasShare"."userId" = $2
        )
    )
);