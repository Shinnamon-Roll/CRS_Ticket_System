import type { Ticket, Priority } from '../types';
import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  User,
  Clock,
} from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  index: number;
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

  return (
    <div
      className="animate-fade-in-up bg-white rounded-xl border border-brown-100/60 p-3.5 hover:shadow-lg hover:shadow-brown-200/30 hover:border-brown-200/80
        transition-all duration-300 cursor-pointer group"
      style={{ animationDelay: `${index * 60}ms` }}
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
      <p className="text-xs text-brown-500 leading-relaxed mb-3 line-clamp-2">
        {ticket.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-cream-200/80">
        {/* Department */}
        <span className="text-[10px] text-brown-400 font-medium truncate max-w-[45%]">
          {ticket.department.split(' (')[0]}
        </span>

        <div className="flex items-center gap-2">
          {/* Assigned Tech */}
          {ticket.assignedToName ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-brown-600 font-medium">
              <User className="w-3 h-3 text-brown-400" />
              {ticket.assignedToName}
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
      <div className="flex items-center gap-1 mt-1.5">
        <Clock className="w-3 h-3 text-brown-300" />
        <span className="text-[10px] text-brown-400">
          {new Date(ticket.updatedAt).toLocaleString('th-TH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
