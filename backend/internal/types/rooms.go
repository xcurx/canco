package types

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/xcurx/canco-backend/internal/database"
)

var roomManager *RoomManager
var once sync.Once

func GetRoomManager() *RoomManager {
	once.Do(func() {
		roomManager = &RoomManager{
			Rooms: make(map[string]*Room),
		}
	})
	return roomManager
}

func RoomExists(roomId string) bool {
	if roomManager == nil {
		return false
	}
	roomManager.mutex.RLock()
	defer roomManager.mutex.RUnlock()
    _, ok := roomManager.Rooms[roomId]
	return ok
}

func (rm *RoomManager) GetOrCreateRoom(roomID string, isPersistent bool, db *database.DB) *Room {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	if room, exists := rm.Rooms[roomID]; exists {
 		return room    
	}

	roomState := RoomState{
		Shapes:     []Shape{},
		History:    []Operation{},
	}

	if (isPersistent) {
		shapes, err := db.Queries.GetShapesByCanvasId(context.Background(), roomID);
		if err != nil {
			log.Printf("Error fetching shapes from db %v", err)
		}
		
		for _, s := range shapes {
			roomState.Shapes = append(roomState.Shapes, Shape{
				ID: s.ID,
				Type: s.Type,
				X: float64(s.X),
				Y: float64(s.Y),
				Width: float64(s.Width),
				Height: float64(s.Height),
				Color: s.Color,
				ZIndex: int(s.ZIndex),
			})
		}
	}

	room := &Room{
		ID:         roomID,
		Title:      "Untitled Room",
		Users:      []User{},
		RoomState:  roomState,
	}
	rm.Rooms[roomID] = room
	return room
}

func (r *Room) AddUser(conn *websocket.Conn, userId string) string {
    r.Mutex.Lock()
	defer r.Mutex.Unlock()

	user := User{
		ID:  userId,
		Name: "Anonymous",
		UserState: UserState{
			Operation: make([]Operation, 0),
			Selected:  "",
			UndoStack: make([]int, 0),
			RedoStack: make([]int, 0),
		},
		Conn: conn,
	}

	r.Users = append(r.Users, user)
	log.Printf("User %s joined room %s", user.ID, r.ID)

	conn.WriteJSON(Event{
		Type: "join",
		Data: r.RoomState.Shapes,
	})
	return user.ID
}

func (r *Room) RemoveUser(id string) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	for i, user := range r.Users {
		if user.ID == id {
			r.Users = append(r.Users[:i], r.Users[i+1:]...)
			log.Printf("User %s left room %s", user.ID, r.ID)
			break
		}
	}
}

func (r *Room) BroadcastEvent(eventType string, data interface{}) {
	r.Mutex.RLock()
	defer r.Mutex.RUnlock()

	event := Event{
		Type: eventType,
		Data: data,
	}

	message, err := json.Marshal(event)
	if err != nil {
		log.Println("Marshal error:", err)
		return
	}

	for _, user := range r.Users {
		log.Println("Broadcasting to user", user.ID)
		if err := user.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Println("WriteMessage error for user", user.ID, ":", err)
		}
	}
}