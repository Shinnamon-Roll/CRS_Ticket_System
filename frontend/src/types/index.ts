// ===== Types =====

export type Role = 'user' | 'admin';

export type TicketStage = 'request' | 'doing' | 'review' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  nameEn: string;
  role: Role;
  department: string;
  departmentId?: string;
  avatar?: string;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  location?: string;
  requestorName?: string;
  ownerName?: string;
  imageUrl?: string;
  createdOn?: string;
  department: string;
  departmentId?: string;
  reportedBy: string;       // User id
  reportedByName: string;
  assignedTo?: string;      // Admin/technician id
  assignedToName?: string;
  priority: Priority;
  stage: TicketStage;
  createdAt: string;
  updatedAt: string;
  category?: string;
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

export interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  createdAt: string;
}
