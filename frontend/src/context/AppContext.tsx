import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Role, Ticket, User, Notification, TicketStage, Priority, ChatMessage } from '../types';
import { mockNotifications } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface BackendUser {
  id: number;
  name: string;
  role: Role;
  department: string;
}

interface BackendTicket {
  id: number;
  ticket_code: string;
  title: string;
  description: string;
  location: string;
  status: TicketStage;
  priority: Priority;
  image_url?: string | null;
  requester_id: number;
  assignee_id?: number | null;
  requester?: BackendUser;
  assignee?: BackendUser | null;
  created_at: string;
  updated_at: string;
}

interface CreateTicketPayload {
  title: string;
  description: string;
  location: string;
  priority: Priority;
  requesterId: string;
  image?: File | null;
}

interface AppContextType {
  // Role switching
  currentRole: Role;
  currentUser: User;
  users: User[];
  switchRole: () => void;

  // Tickets
  tickets: Ticket[];
  refreshTickets: (search?: string) => Promise<void>;
  createTicket: (payload: CreateTicketPayload) => Promise<Ticket>;
  assignTicket: (id: string, assigneeId: string) => Promise<void>;
  getTicketsByStage: (stage: string) => Ticket[];
  getUserTickets: () => Ticket[];
  updateTicketStage: (id: string, stage: TicketStage) => Promise<void>;
  reviewTicket: (id: string, isApproved: boolean) => Promise<void>;

  // Ticket chat
  activeChatTicketId: string | null;
  openTicketChat: (ticketId: string) => void;
  closeTicketChat: () => void;
  getTicketChatMessages: (ticketId: string) => ChatMessage[];
  sendTicketChatMessage: (ticketId: string, payload: { text?: string; image?: File | null }) => Promise<void>;
  canCurrentUserChat: (ticket: Ticket) => boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);
  const [chatMessagesByTicket, setChatMessagesByTicket] = useState<Record<string, ChatMessage[]>>({});

  const currentUser =
    users.find((u) => u.role === currentRole) ||
    {
      id: '0',
      name: 'Unknown User',
      nameEn: 'U',
      role: currentRole,
      department: '-',
    };

  const mapUser = useCallback((user: BackendUser): User => {
    const initial = user.name.trim().charAt(0).toUpperCase() || 'U';
    return {
      id: String(user.id),
      name: user.name,
      nameEn: initial,
      role: user.role,
      department: user.department,
    };
  }, []);

  const mapTicket = useCallback((ticket: BackendTicket): Ticket => {
    const requestorName = ticket.requester?.name || `User #${ticket.requester_id}`;
    const ownerName = ticket.assignee?.name;
    const imageUrl = ticket.image_url
      ? ticket.image_url.startsWith('http')
        ? ticket.image_url
        : `${API_BASE_URL}${ticket.image_url}`
      : undefined;

    return {
      id: String(ticket.id),
      code: ticket.ticket_code,
      title: ticket.title,
      description: ticket.description,
      location: ticket.location,
      requestorName,
      ownerName,
      imageUrl,
      createdOn: ticket.created_at,
      department: ticket.requester?.department || '-',
      reportedBy: String(ticket.requester_id),
      reportedByName: requestorName,
      assignedTo: ticket.assignee_id ? String(ticket.assignee_id) : undefined,
      assignedToName: ownerName,
      priority: ticket.priority,
      stage: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      category: ticket.location,
    };
  }, []);

  const refreshUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/users`);
    if (!res.ok) throw new Error('failed to fetch users');
    const data: BackendUser[] = await res.json();
    setUsers(data.map(mapUser));
  }, [mapUser]);

  const refreshTickets = useCallback(
    async (search = '') => {
      const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
      const res = await fetch(`${API_BASE_URL}/api/tickets${query}`);
      if (!res.ok) throw new Error('failed to fetch tickets');
      const data: BackendTicket[] = await res.json();
      setTickets(data.map(mapTicket));
    },
    [mapTicket]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([refreshUsers(), refreshTickets()]);
      } catch (error) {
        console.error(error);
      }
    };
    void bootstrap();
  }, [refreshUsers, refreshTickets]);

  const switchRole = useCallback(() => {
    setCurrentRole((prev) => (prev === 'admin' ? 'user' : 'admin'));
  }, []);

  const getTicketsByStage = useCallback(
    (stage: string) => tickets.filter((t) => t.stage === stage),
    [tickets]
  );

  const getUserTickets = useCallback(
    () => tickets.filter((t) => t.reportedBy === currentUser.id),
    [tickets, currentUser.id]
  );

  const createTicket = useCallback(async (payload: CreateTicketPayload) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('location', payload.location);
    formData.append('priority', payload.priority);
    formData.append('requester_id', payload.requesterId);
    if (payload.image) {
      formData.append('image', payload.image);
    }

    const res = await fetch(`${API_BASE_URL}/api/tickets`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'failed to create ticket' }));
      throw new Error(err.error || 'failed to create ticket');
    }

    const created: BackendTicket = await res.json();
    const mapped = mapTicket(created);
    setTickets((prev) => [mapped, ...prev]);
    return mapped;
  }, [mapTicket]);

  const updateTicketStage = useCallback(async (id: string, stage: TicketStage) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: stage }),
    });
    if (!res.ok) throw new Error('failed to update ticket status');

    const updated: BackendTicket = await res.json();
    const mapped = mapTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === id ? mapped : t)));
  }, [mapTicket]);

  const reviewTicket = useCallback(async (id: string, isApproved: boolean) => {
    await updateTicketStage(id, isApproved ? 'done' : 'doing');
  }, [updateTicketStage]);

  const assignTicket = useCallback(async (id: string, assigneeId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee_id: Number(assigneeId) }),
    });
    if (!res.ok) throw new Error('failed to assign ticket');

    const updated: BackendTicket = await res.json();
    const mapped = mapTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === id ? mapped : t)));
  }, [mapTicket]);

  const openTicketChat = useCallback((ticketId: string) => {
    setActiveChatTicketId(ticketId);
  }, []);

  const closeTicketChat = useCallback(() => {
    setActiveChatTicketId(null);
  }, []);

  const getTicketChatMessages = useCallback(
    (ticketId: string) => chatMessagesByTicket[ticketId] || [],
    [chatMessagesByTicket]
  );

  const canCurrentUserChat = useCallback(
    (ticket: Ticket) => {
      if (!ticket.assignedTo) return false;
      return currentUser.id === ticket.reportedBy || currentUser.id === ticket.assignedTo;
    },
    [currentUser.id]
  );

  const sendTicketChatMessage = useCallback(
    async (ticketId: string, payload: { text?: string; image?: File | null }) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) throw new Error('ticket not found');
      if (!canCurrentUserChat(ticket)) throw new Error('permission denied');

      const text = payload.text?.trim();
      const hasImage = Boolean(payload.image);
      if (!text && !hasImage) return;

      let imageUrl: string | undefined;
      if (payload.image) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('failed to read image'));
          reader.readAsDataURL(payload.image as Blob);
        });
      }

      const message: ChatMessage = {
        id: `${ticketId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ticketId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text,
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      setChatMessagesByTicket((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), message],
      }));
    },
    [canCurrentUserChat, currentUser.id, currentUser.name, tickets]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        users,
        switchRole,
        tickets,
        refreshTickets,
        createTicket,
        assignTicket,
        getTicketsByStage,
        getUserTickets,
        updateTicketStage,
        reviewTicket,
        activeChatTicketId,
        openTicketChat,
        closeTicketChat,
        getTicketChatMessages,
        sendTicketChatMessage,
        canCurrentUserChat,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllRead,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
