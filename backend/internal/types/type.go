package types

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

type User struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Conn *websocket.Conn
	UserState
}

type UserState struct {
	Operation []Operation `json:"operations"`
	Selected  string      `json:"selected"`
	UndoStack []int       `json:"undoStack"`
	RedoStack []int       `json:"redoStack"`
}

type Room struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Users     []User    `json:"users"`
	RoomState RoomState `json:"roomState"`
	Mutex     sync.RWMutex
}

type RoomState struct {
	Shapes     []Shape     `json:"shapes"`
	History    []Operation `json:"history"`
}

type RoomManager struct {
	Rooms map[string]*Room `json:"rooms"`
	mutex sync.RWMutex
}

type Shape struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	X          float64    `json:"x"`
	Y          float64    `json:"y"`
	Width      float64    `json:"width"`
	Height     float64    `json:"height"`
	Color      string `json:"color"`
	ZIndex     int    `json:"zIndex"`
	Rotation   float64 `json:"rotation"`
	Text       string `json:"text,omitempty"`
	FontSize   float64 `json:"fontSize,omitempty"`
}
type PartialShape struct {
	ID         *string `json:"id,omitempty"`
	Type       *string `json:"type,omitempty"`
	X          *float64    `json:"x,omitempty"`
	Y          *float64    `json:"y,omitempty"`
	Width      *float64    `json:"width,omitempty"`
	Height     *float64    `json:"height,omitempty"`
	Color      *string `json:"color,omitempty"`
	IsSelected *bool   `json:"isSelected,omitempty"`
	ZIndex     *int    `json:"zIndex,omitempty"`
	Rotation   *float64 `json:"rotation,omitempty"`
	Text       *string `json:"text,omitempty"`
	FontSize   *float64 `json:"fontSize,omitempty"`
}

type Operation struct {
	ID        string        `json:"id"`
	Type      OperationType `json:"type"`
	Timestamp int64         `json:"timestamp"`
	Data      interface{}   `json:"data"`
	Inverse   *Operation    `json:"inverse,omitempty"`
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
	// Note: We use ot-1 because iota + 1 makes the first value 1.
	if ot >= CreateShape && ot <= DeselectAll {
		return [...]string{"CREATE_SHAPE", "UPDATE_SHAPE", "DELETE_SHAPE", "SELECT_SHAPE", "DESELECT_ALL"}[ot-1]
	}
	return fmt.Sprintf("UnknownOperationType(%d)", ot)
}

func (ot OperationType) EnumIndex() int {
	return int(ot)
}

func (ot *OperationType) UnmarshalJSON(b []byte) error {
	var s string
	// Unmarshal the JSON value (which is a string) into a temporary Go string variable.
	if err := json.Unmarshal(b, &s); err != nil {
		return fmt.Errorf("operation type must be a string: %w", err)
	}

	// Clean up and convert the string to the corresponding OperationType
	switch strings.ToLower(s) {
	case "create_shape":
		*ot = CreateShape
	case "update_shape":
		*ot = UpdateShape
	case "delete_shape":
		*ot = DeleteShape
	case "select_shape":
		*ot = SelectShape
	case "deselect_all":
		*ot = DeselectAll
	default:
		return fmt.Errorf("invalid operation type string: %q", s)
	}

	return nil
}

func (ot OperationType) MarshalJSON() ([]byte, error) {
	s := ot.String()
	return json.Marshal(s)
}

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
