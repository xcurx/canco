package types

import (
	"log"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
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

func (rm *RoomManager) GetOrCreateRoom(roomID string) *Room {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	if room, exists := rm.Rooms[roomID]; exists {
 		return room    
	}

	room := &Room{
		ID:         roomID,
		Title:      "Untitled Room",
		Users:      []User{},
		Operations: []Operation{},
	}
	rm.Rooms[roomID] = room
	return room
}

func (r *Room) AddUser(conn *websocket.Conn) {
    r.mutex.Lock()
	defer r.mutex.Unlock()

	user := User{
		ID:   uuid.New().String(),
		Name: "Anonymous",
		Conn: conn,
	}

	r.Users = append(r.Users, user)
	log.Printf("User %s joined room %s", user.ID, r.ID)
}