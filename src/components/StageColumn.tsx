import { Droppable } from '@hello-pangea/dnd';
import type { TicketStage, Ticket } from '../types';
import { stageConfig } from '../data/mockData';
import TicketCard from './TicketCard';
import {
  Inbox,
  Wrench,
  Search,
  CheckCircle,
} from 'lucide-react';

interface StageColumnProps {
  stageKey: TicketStage;
  tickets: Ticket[];
}

const iconMap: Record<string, React.ReactNode> = {
  inbox: <Inbox className="w-4 h-4" />,
  wrench: <Wrench className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  'check-circle': <CheckCircle className="w-4 h-4" />,
};

export default function StageColumn({ stageKey, tickets }: StageColumnProps) {
  const stage = stageConfig.find((s) => s.key === stageKey)!;

  return (
    <div className="flex flex-col h-full bg-cream-50/50 rounded-2xl border border-brown-100/40 overflow-hidden shadow-sm">
      {/* Column Header */}
      <div
        className={`flex items-center gap-2.5 px-4 py-3 border-b ${stage.borderColor} ${stage.bgColor}`}
      >
        <span className={`${stage.color}`}>{iconMap[stage.icon]}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold ${stage.color}`}>{stage.label}</h3>
          <p className="text-[10px] text-brown-400 uppercase tracking-wider">{stage.labelEn}</p>
        </div>
        <span
          className={`w-7 h-7 rounded-lg ${stage.bgColor} border ${stage.borderColor} flex items-center justify-center text-xs font-bold ${stage.color}`}
        >
          {tickets.length}
        </span>
      </div>

      {/* Card List */}
      <Droppable droppableId={stageKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-brown-100/30' : ''}`}
          >
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-brown-300 pointer-events-none">
                {iconMap[stage.icon]}
                <p className="text-xs mt-2 italic">ไม่มีรายการ</p>
              </div>
            ) : (
              tickets.map((ticket, idx) => (
                <TicketCard key={ticket.id} ticket={ticket} index={idx} />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

