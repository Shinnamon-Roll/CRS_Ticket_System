package controllers

import (
	"sync"

	"github.com/gorilla/websocket"
)

type ticketHub struct {
	mu      sync.RWMutex
	clients map[uint]map[*websocket.Conn]uint
}

func newTicketHub() *ticketHub {
	return &ticketHub{clients: make(map[uint]map[*websocket.Conn]uint)}
}

func (h *ticketHub) addClient(ticketID uint, userID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[ticketID]; !ok {
		h.clients[ticketID] = make(map[*websocket.Conn]uint)
	}
	h.clients[ticketID][conn] = userID
}

func (h *ticketHub) removeClient(ticketID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[ticketID]; !ok {
		return
	}

	delete(h.clients[ticketID], conn)
	if len(h.clients[ticketID]) == 0 {
		delete(h.clients, ticketID)
	}
}

func (h *ticketHub) broadcast(ticketID uint, event chatEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for conn := range h.clients[ticketID] {
		if err := conn.WriteJSON(event); err != nil {
			_ = conn.Close()
		}
	}
}
