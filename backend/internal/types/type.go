package types

import (
	"sync"

	"github.com/gorilla/websocket"
)

type User struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Conn *websocket.Conn
}

type Room struct {
	ID         string      `json:"id"`
	Title      string      `json:"title"`
	Users      []User      `json:"users"`
	Operations []Operation `json:"operations"`
	mutex      sync.RWMutex
}

type RoomManager struct {
	Rooms map[string]*Room `json:"rooms"`
	mutex sync.RWMutex
}

type Shape struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	X          int    `json:"x"`
	Y          int    `json:"y"`
	Width      int    `json:"width"`
	Height     int    `json:"height"`
	Color      string `json:"color"`
	IsSelected bool   `json:"isSelected"`
	ZIndex     int    `json:"zIndex"`
}

type Operation struct {
	ID        string        `json:"id"`
	Type      OperationType `json:"type"`
	Timestamp int64         `json:"timestamp"`
	Data      interface{}   `json:"data"`
}

type OperationType int

const (
	CreateShape OperationType = iota + 1
	UpdateShape
	DeleteShape
	SelectShape
	DeselectAll
)

func (ot OperationType) String() string {
	return [...]string{"CreateShape", "UpdateShape", "DeleteShape", "SelectShape", "DeselectAll"}[ot-1]
}

func (ot OperationType) EnumIndex() int {
	return int(ot)
}
