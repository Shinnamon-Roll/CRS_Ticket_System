import { useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { TicketStage } from '../types';
import { stageConfig } from '../data/mockData';
import StageColumn from './StageColumn';

const stages: TicketStage[] = ['request', 'doing', 'review', 'done'];

export default function KanbanBoard() {
  const { tickets, updateTicketStage, currentRole } = useApp();

  const ticketsByStage = useMemo(() => {
    const map: Record<TicketStage, typeof tickets> = {
      request: [],
      doing: [],
      review: [],
      done: [],
    };
    tickets.forEach((t) => {
      if (map[t.stage]) map[t.stage].push(t);
    });
    return map;
  }, [tickets]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Only admins can drag and drop, or users can if needed? Usually Admin handles Kanban.
    if (currentRole !== 'admin') return;

    const newStage = destination.droppableId as TicketStage;
    updateTicketStage(draggableId, newStage);
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-140px)]">
      {/* Summary Bar (Clickable Stage Pills) */}
      <div className="flex flex-wrap gap-3 mb-5 shrink-0">
        {stageConfig.map((stage) => {
          const count = ticketsByStage[stage.key as TicketStage].length;
          return (
            <Link
              key={stage.key}
              to={`/stage/${stage.key}`}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${stage.borderColor} ${stage.bgColor} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
            >
              <span className={`text-lg font-bold ${stage.color}`}>{count}</span>
              <span className={`text-xs font-medium ${stage.color}`}>{stage.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Grid Layout (Replaced RGL with flexible grid) */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-[1000px] h-full items-start">
            {stages.map((stageKey) => (
              <div key={stageKey} className="flex-1 w-80 h-full max-h-full">
                <StageColumn stageKey={stageKey} tickets={ticketsByStage[stageKey]} />
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
