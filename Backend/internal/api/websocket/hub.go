package websocket

import (
	"encoding/json"
	"log"
	"log-analyzer/internal/entities"
	"sync"
)

type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastAlert(alert *entities.Alert) {
	if h == nil || alert == nil {
		return
	}

	payload := struct {
		Type string         `json:"type"`
		Data *entities.Alert `json:"data"`
	}{
		Type: "alert",
		Data: alert,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("ws marshal error: %v", err)
		return
	}

	select {
	case h.broadcast <- data:
	default:
	}
}
