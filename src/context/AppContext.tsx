import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, Ticket, User, Notification, TicketStage } from '../types';
import { mockUsers, mockTickets, mockNotifications } from '../data/mockData';

interface AppContextType {
  // Role switching
  currentRole: Role;
  currentUser: User;
  switchRole: () => void;

  // Tickets
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  getTicketsByStage: (stage: string) => Ticket[];
  getUserTickets: () => Ticket[];
  updateTicketStage: (id: string, stage: TicketStage) => void;
  reviewTicket: (id: string, isApproved: boolean) => void;

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
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUser = currentRole === 'admin' ? mockUsers[1] : mockUsers[0];

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

  const updateTicketStage = useCallback((id: string, stage: TicketStage) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, stage, updatedAt: new Date().toISOString() } : t
      )
    );
  }, []);

  const reviewTicket = useCallback((id: string, isApproved: boolean) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              stage: isApproved ? 'done' : 'doing',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

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
        switchRole,
        tickets,
        setTickets,
        getTicketsByStage,
        getUserTickets,
        updateTicketStage,
        reviewTicket,
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
