import { Draggable } from '@hello-pangea/dnd';
import { useApp } from '../context/AppContext';
import type { Ticket, Priority } from '../types';
import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  index?: number;
}

const priorityConfig: Record<
  Priority,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  urgent: {
    label: 'เร่งด่วน',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  high: {
    label: 'สูง',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <ArrowUp className="w-3 h-3" />,
  },
  medium: {
    label: 'ปานกลาง',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: <ArrowRight className="w-3 h-3" />,
  },
  low: {
    label: 'ต่ำ',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: <ArrowDown className="w-3 h-3" />,
  },
};

export default function TicketCard({ ticket, index }: TicketCardProps) {
  const pConfig = priorityConfig[ticket.priority];
  const { currentRole, currentUser, reviewTicket, assignTicket, openTicketChat } = useApp();

  const isReviewStage = ticket.stage === 'review' && currentRole === 'user';
  const canAcceptTask = currentRole === 'admin' && !ticket.assignedTo;

  const cardContent = (
    <div
      onClick={() => openTicketChat(ticket.id)}
      className="animate-fade-in-up bg-white rounded-xl border border-brown-100/60 p-3.5 hover:shadow-lg hover:shadow-brown-200/30 hover:border-brown-200/80
        transition-all duration-300 cursor-pointer group h-full flex flex-col"
      style={{ animationDelay: `${(index ?? 0) * 60}ms` }}
    >
      {/* Top row: Code + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-brown-500 tracking-wide font-mono">
          {ticket.code}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${pConfig.color} ${pConfig.bg} ${pConfig.border}`}
        >
          {pConfig.icon}
          {pConfig.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-brown-800 leading-snug mb-1.5 group-hover:text-brown-900 transition-colors line-clamp-2">
        {ticket.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-brown-500 leading-relaxed mb-3 line-clamp-2 flex-1">
        {ticket.description}
      </p>

      {ticket.imageUrl && (
        <img
          src={ticket.imageUrl}
          alt={ticket.title}
          className="w-full h-28 object-cover rounded-lg border border-brown-100 mb-3"
          loading="lazy"
        />
      )}

      <div className="grid grid-cols-1 gap-1.5 mb-3 text-[11px]">
        <p className="text-brown-500">
          <span className="font-semibold text-brown-700">Requestor:</span> {ticket.requestorName || ticket.reportedByName || '-'}
        </p>
        <p className="text-brown-500 line-clamp-1">
          <span className="font-semibold text-brown-700">Location:</span> {ticket.location || '-'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-cream-200/80 mt-auto">
        <div className="flex items-center justify-between">
          {/* Department */}
          <span className="text-[10px] text-brown-400 font-medium truncate max-w-[45%]">
            {ticket.department.split(' (')[0]}
          </span>

          <div className="flex items-center gap-2">
            {/* Assigned Tech */}
            {ticket.assignedToName ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-brown-600 font-medium">
                <User className="w-3 h-3 text-brown-400" />
                {ticket.ownerName || ticket.assignedToName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-brown-400 italic">
                <User className="w-3 h-3" />
                ยังไม่มอบหมาย
              </span>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-brown-300" />
            <span className="text-[10px] text-brown-400">
              {new Date(ticket.createdOn || ticket.createdAt).toLocaleString('th-TH', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* User Review Action Buttons */}
        {isReviewStage && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-brown-100">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reviewTicket(ticket.id, true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              ทำงานเสร็จแล้ว
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reviewTicket(ticket.id, false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              ส่งกลับแก้ไข
            </button>
          </div>
        )}

        {canAcceptTask && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              assignTicket(ticket.id, currentUser.id);
            }}
            className="mt-2 w-full px-2 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
          >
            รับงานนี้เป็น Owner
          </button>
        )}
      </div>
    </div>
  );

  // If index is undefined (e.g. Stage Summary Page), don't wrap in Draggable
  if (index === undefined) {
    return cardContent;
  }

  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={`${snapshot.isDragging ? 'shadow-2xl scale-105 z-50' : ''}`}
        >
          {cardContent}
        </div>
      )}
    </Draggable>
  );
}

