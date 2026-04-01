import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, Ticket, User, Notification } from '../types';
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

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activePage: string;
  setActivePage: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  const currentUser = currentRole === 'admin' ? mockUsers[1] : mockUsers[0];

  const switchRole = useCallback(() => {
    setCurrentRole((prev) => {
      const next = prev === 'admin' ? 'user' : 'admin';
      // Switch default page too
      if (next === 'user') setActivePage('my-requests');
      else setActivePage('dashboard');
      return next;
    });
  }, []);

  const getTicketsByStage = useCallback(
    (stage: string) => tickets.filter((t) => t.stage === stage),
    [tickets]
  );

  const getUserTickets = useCallback(
    () => tickets.filter((t) => t.reportedBy === currentUser.id),
    [tickets, currentUser.id]
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
        switchRole,
        tickets,
        setTickets,
        getTicketsByStage,
        getUserTickets,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllRead,
        sidebarOpen,
        setSidebarOpen,
        activePage,
        setActivePage,
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
