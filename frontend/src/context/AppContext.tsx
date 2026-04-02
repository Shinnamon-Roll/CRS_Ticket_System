import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Role, Ticket, User, Notification, TicketStage, Priority, ChatMessage, Department } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
const NOTIFICATIONS_STORAGE_KEY = 'crs_notifications';
const LANGUAGE_STORAGE_KEY = 'crs_language';

type AppLanguage = 'th' | 'en';

interface BackendUser {
  id: number;
  name: string;
  role: Role;
  email: string;
  department_id: number;
  department?: {
    id: number;
    name: string;
  } | null;
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
  department_id?: number | null;
  assignee_id?: number | null;
  requester?: BackendUser;
  assignee?: BackendUser | null;
  department?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface BackendChatMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender?: BackendUser;
  message_text?: string | null;
  image_url?: string | null;
  created_at: string;
}

interface ChatWebSocketEvent {
  type: 'message.created';
  message: BackendChatMessage;
}

interface BackendCreateChatMessagesResponse {
  messages?: BackendChatMessage[];
}

interface CreateTicketPayload {
  title: string;
  description: string;
  location: string;
  priority: Priority;
  requesterId: string;
  departmentId?: string;
  image?: File | null;
}

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  currentRole: Role;
  currentUser: User;
  users: User[];
  departments: Department[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: () => void;

  // Tickets
  tickets: Ticket[];
  refreshTickets: (search?: string) => Promise<void>;
  createTicket: (payload: CreateTicketPayload) => Promise<Ticket>;
  cancelTicket: (id: string) => Promise<void>;
  assignTicket: (id: string, assigneeId: string) => Promise<void>;
  getTicketsByStage: (stage: string) => Ticket[];
  getUserTickets: () => Ticket[];
  getDepartmentTasks: () => Ticket[];
  updateTicketStage: (id: string, stage: TicketStage) => Promise<void>;
  reviewTicket: (id: string, isApproved: boolean) => Promise<void>;

  // Ticket chat
  activeChatTicketId: string | null;
  openTicketChat: (ticketId: string) => void;
  closeTicketChat: () => void;
  getTicketChatMessages: (ticketId: string) => ChatMessage[];
  sendTicketChatMessage: (ticketId: string, payload: { text?: string; images?: File[] }) => Promise<void>;
  canCurrentUserChat: (ticket: Ticket) => boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  // Language
  language: AppLanguage;
  toggleLanguage: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('user');
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem('crs_user_id'));
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as Notification[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'th';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);
  const [chatMessagesByTicket, setChatMessagesByTicket] = useState<Record<string, ChatMessage[]>>({});
  const [loadedChatTickets, setLoadedChatTickets] = useState<Record<string, boolean>>({});

  const currentUser =
    users.find((u) => u.id === currentUserId) ||
    {
      id: '0',
      name: 'Unknown User',
      nameEn: 'U',
      role: 'user' as Role,
      department: '-',
    };

  const isAuthenticated = Boolean(currentUserId && currentUserId !== '0');

  const mapUser = useCallback((user: BackendUser): User => {
    const initial = user.name.trim().charAt(0).toUpperCase() || 'U';
    const deptName = user.department?.name || '-';
    return {
      id: String(user.id),
      name: user.name,
      nameEn: initial,
      role: user.role,
      department: deptName,
      departmentId: String(user.department_id),
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
    const deptName = ticket.department?.name || (typeof ticket.requester?.department === 'object' && ticket.requester.department
      ? ticket.requester.department.name
      : (ticket.requester?.department as any) || '-');

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
      department: deptName,
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

  const mapChatMessage = useCallback((message: BackendChatMessage): ChatMessage => {
    const imageUrl = message.image_url
      ? message.image_url.startsWith('http')
        ? message.image_url
        : `${API_BASE_URL}${message.image_url}`
      : undefined;

    return {
      id: String(message.id),
      ticketId: String(message.ticket_id),
      senderId: String(message.sender_id),
      senderName: message.sender?.name || `User #${message.sender_id}`,
      text: message.message_text || undefined,
      imageUrl,
      createdAt: message.created_at,
    };
  }, []);

  const refreshUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/users`);
    if (!res.ok) throw new Error('failed to fetch users');
    const data: BackendUser[] = await res.json();
    setUsers(data.map(mapUser));
  }, [mapUser]);

  const refreshDepartments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments`);
      if (res.ok) {
        const data: Array<{ id: number; name: string }> = await res.json();
        setDepartments(data.map(d => ({ id: String(d.id), name: d.name })));
      }
    } catch (error) {
      console.error('failed to fetch departments');
    }
  }, []);

  const refreshTickets = useCallback(
    async (search = '') => {
      if (!currentUser.id || currentUser.id === '0') {
        setTickets([]);
        return;
      }
      const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}&user_id=${encodeURIComponent(currentUser.id)}` : `?user_id=${encodeURIComponent(currentUser.id)}`;
      const res = await fetch(`${API_BASE_URL}/api/tickets${query}`);
      if (!res.ok) throw new Error('failed to fetch tickets');
      const data: BackendTicket[] = await res.json();
      setTickets(data.map(mapTicket));
    },
    [mapTicket, currentUser.id]
  );

  useEffect(() => {
    if (currentUser.id !== '0') {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([refreshUsers(), refreshTickets(), refreshDepartments()]);
      } catch (error) {
        console.error(error);
      }
    };
    void bootstrap();
  }, [refreshUsers, refreshTickets, refreshDepartments]);

  const switchRole = useCallback(() => {
    // role switching disabled after introducing real login.
  }, []);

  const pushNotification = useCallback((payload: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const created: Notification = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      title: payload.title,
      message: payload.message,
      ticketCode: payload.ticketCode,
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [created, ...prev]);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'login failed' }));
      throw new Error(err.error || 'login failed');
    }

    const data: { user: BackendUser } = await res.json();
    const mapped = mapUser(data.user);

    setCurrentUserId(mapped.id);
    setCurrentRole(mapped.role);
    localStorage.setItem('crs_user_id', mapped.id);
    await Promise.all([refreshUsers(), refreshTickets(), refreshDepartments()]);
  }, [mapUser, refreshDepartments, refreshTickets, refreshUsers]);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setCurrentRole('user');
    localStorage.removeItem('crs_user_id');
    setActiveChatTicketId(null);
  }, []);

  const getTicketsByStage = useCallback(
    (stage: string) => tickets.filter((t) => t.stage === stage),
    [tickets]
  );

  const getUserTickets = useCallback(
    () => tickets.filter((t) => t.reportedBy === currentUser.id),
    [tickets, currentUser.id]
  );

  const getDepartmentTasks = useCallback(() => {
    return tickets.filter((t) => {
      if (t.department !== currentUser.department) return false;
      if (t.stage === 'done') return false;
      return true;
    });
  }, [tickets, currentUser.department]);

  const createTicket = useCallback(async (payload: CreateTicketPayload) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('location', payload.location);
    formData.append('priority', payload.priority);
    formData.append('requester_id', payload.requesterId);
    if (payload.departmentId) {
      formData.append('department_id', payload.departmentId);
    }
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
    pushNotification({
      title: 'ส่งคำขอสำเร็จ',
      message: `${mapped.code} ถูกสร้างเรียบร้อยแล้ว`,
      ticketCode: mapped.code,
    });
    return mapped;
  }, [mapTicket, pushNotification]);

  const cancelTicket = useCallback(async (id: string) => {
    const res = await fetch(
      `${API_BASE_URL}/api/tickets/${id}?requester_id=${encodeURIComponent(currentUser.id)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'failed to cancel ticket' }));
      throw new Error(err.error || 'failed to cancel ticket');
    }

    const removed = tickets.find((t) => t.id === id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
    pushNotification({
      title: 'ยกเลิกคำขอแล้ว',
      message: `${removed?.code || 'Ticket'} ถูกยกเลิกเรียบร้อย`,
      ticketCode: removed?.code,
    });
  }, [currentUser.id, pushNotification, tickets]);

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

    pushNotification({
      title: 'สถานะงานอัปเดต',
      message: `${mapped.code} เปลี่ยนสถานะเป็น ${mapped.stage}`,
      ticketCode: mapped.code,
    });
  }, [mapTicket, pushNotification]);

  const reviewTicket = useCallback(async (id: string, isApproved: boolean) => {
    await updateTicketStage(id, isApproved ? 'done' : 'doing');
  }, [updateTicketStage]);

  const assignTicket = useCallback(async (id: string, assigneeId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/assign?user_id=${encodeURIComponent(currentUser.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee_id: Number(assigneeId) }),
    });
    if (!res.ok) throw new Error('failed to assign ticket');

    const updated: BackendTicket = await res.json();
    const mapped = mapTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === id ? mapped : t)));

    pushNotification({
      title: 'มีผู้รับงานแล้ว',
      message: `${mapped.code} ถูกมอบหมายให้ ${mapped.assignedToName || 'เจ้าหน้าที่'}`,
      ticketCode: mapped.code,
    });
  }, [mapTicket, pushNotification]);

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

  const upsertChatMessage = useCallback((message: ChatMessage) => {
    setChatMessagesByTicket((prev) => {
      const exists = (prev[message.ticketId] || []).some((item) => item.id === message.id);
      if (exists) return prev;
      return {
        ...prev,
        [message.ticketId]: [...(prev[message.ticketId] || []), message],
      };
    });
  }, []);

  const canCurrentUserChat = useCallback(
    (ticket: Ticket) => {
      if (currentUser.id === ticket.reportedBy) return true;
      if (ticket.assignedTo && currentUser.id === ticket.assignedTo) return true;
      return false;
    },
    [currentUser.id]
  );

  const sendTicketChatMessage = useCallback(
    async (ticketId: string, payload: { text?: string; images?: File[] }) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) throw new Error('ticket not found');
      if (!canCurrentUserChat(ticket)) throw new Error('permission denied');

      const text = payload.text?.trim();
      const files = payload.images || [];
      if (!text && files.length === 0) return;

      const formData = new FormData();
      formData.append('sender_id', currentUser.id);
      if (text) {
        formData.append('text', text);
      }
      files.forEach((file) => {
        formData.append('images', file);
      });
      if (files.length === 1) {
        formData.append('image', files[0]);
      }

      const res = await fetch(
        `${API_BASE_URL}/api/tickets/${ticketId}/chat-messages?user_id=${encodeURIComponent(currentUser.id)}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'failed to send chat message' }));
        throw new Error(err.error || 'failed to send chat message');
      }

      const data: BackendChatMessage | BackendCreateChatMessagesResponse = await res.json();
      if (typeof (data as BackendChatMessage).id === 'number') {
        upsertChatMessage(mapChatMessage(data as BackendChatMessage));
        return;
      }

      const many = (data as BackendCreateChatMessagesResponse).messages || [];
      many.forEach((item) => upsertChatMessage(mapChatMessage(item)));
    },
    [canCurrentUserChat, currentUser.id, mapChatMessage, tickets, upsertChatMessage]
  );

  useEffect(() => {
    if (!activeChatTicketId || !currentUser.id || currentUser.id === '0') return;

    const ticket = tickets.find((item) => item.id === activeChatTicketId);
    if (!ticket || !canCurrentUserChat(ticket)) return;

    let canceled = false;

    const loadMessages = async () => {
      if (loadedChatTickets[activeChatTicketId]) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/tickets/${activeChatTicketId}/chat-messages?user_id=${encodeURIComponent(currentUser.id)}`
        );
        if (!res.ok) return;

        const data: BackendChatMessage[] = await res.json();
        if (canceled) return;

        setChatMessagesByTicket((prev) => ({
          ...prev,
          [activeChatTicketId]: data.map(mapChatMessage),
        }));
        setLoadedChatTickets((prev) => ({ ...prev, [activeChatTicketId]: true }));
      } catch (error) {
        console.error(error);
      }
    };

    void loadMessages();

    return () => {
      canceled = true;
    };
  }, [activeChatTicketId, canCurrentUserChat, currentUser.id, loadedChatTickets, mapChatMessage, tickets]);

  useEffect(() => {
    if (!activeChatTicketId || !currentUser.id || currentUser.id === '0') return;

    const ticket = tickets.find((item) => item.id === activeChatTicketId);
    if (!ticket || !canCurrentUserChat(ticket)) return;

    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/tickets/${activeChatTicketId}/chat?user_id=${encodeURIComponent(currentUser.id)}`
    );

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatWebSocketEvent;
        if (payload.type !== 'message.created') return;
        const mapped = mapChatMessage(payload.message);
        upsertChatMessage(mapped);

        if (mapped.senderId !== currentUser.id) {
          const currentTicket = tickets.find((item) => item.id === mapped.ticketId);
          pushNotification({
            title: 'ข้อความใหม่ในแชทงาน',
            message: `${currentTicket?.code || 'Ticket'}: ${mapped.senderName} ส่งข้อความใหม่`,
            ticketCode: currentTicket?.code,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeChatTicketId, canCurrentUserChat, currentUser.id, mapChatMessage, pushNotification, tickets, upsertChatMessage]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'th' ? 'en' : 'th'));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentRole,
        currentUser,
        users,
        departments,
        login,
        logout,
        switchRole,
        tickets,
        refreshTickets,
        createTicket,
        cancelTicket,
        assignTicket,
        getTicketsByStage,
        getUserTickets,
        getDepartmentTasks,
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
        language,
        toggleLanguage,
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
