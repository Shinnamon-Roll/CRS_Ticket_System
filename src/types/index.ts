// ===== Types =====

export type Role = 'user' | 'admin';

export type TicketStage = 'request' | 'doing' | 'review' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  nameEn: string;
  role: Role;
  department: string;
  avatar?: string;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  department: string;
  reportedBy: string;       // User id
  reportedByName: string;
  assignedTo?: string;      // Admin/technician id
  assignedToName?: string;
  priority: Priority;
  stage: TicketStage;
  createdAt: string;
  updatedAt: string;
  category: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  ticketCode?: string;
}

export interface StageInfo {
  key: TicketStage;
  label: string;
  labelEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}
