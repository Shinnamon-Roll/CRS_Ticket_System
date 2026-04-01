import { useMemo, useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useApp } from '../context/AppContext';
import type { TicketStage } from '../types';
import { stageConfig } from '../data/mockData';
import StageColumn from './StageColumn';

const stages: TicketStage[] = ['request', 'doing', 'review', 'done'];

const createLayouts = (): ResponsiveLayouts => ({
  lg: stages.map((stage, i): LayoutItem => ({
    i: stage,
    x: i * 3,
    y: 0,
    w: 3,
    h: 6,
    minW: 2,
    minH: 3,
  })),
  md: stages.map((stage, i): LayoutItem => ({
    i: stage,
    x: (i % 2) * 5,
    y: Math.floor(i / 2) * 6,
    w: 5,
    h: 6,
    minW: 3,
    minH: 3,
  })),
  sm: stages.map((stage, i): LayoutItem => ({
    i: stage,
    x: 0,
    y: i * 5,
    w: 6,
    h: 5,
    minW: 3,
    minH: 3,
  })),
});

export default function KanbanBoard() {
  const { tickets } = useApp();
  const { width, containerRef, mounted } = useContainerWidth();
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(createLayouts);

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

  return (
    <div className="w-full" ref={containerRef}>
      {/* Summary Bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {stageConfig.map((stage) => {
          const count = ticketsByStage[stage.key].length;
          return (
            <div
              key={stage.key}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${stage.borderColor} ${stage.bgColor} transition-all duration-200 hover:shadow-md`}
            >
              <span className={`text-lg font-bold ${stage.color}`}>{count}</span>
              <span className={`text-xs font-medium ${stage.color}`}>{stage.label}</span>
            </div>
          );
        })}
      </div>

      {/* Grid Layout */}
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 900, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={80}
          dragConfig={{ handle: '.drag-handle' }}
          onLayoutChange={(_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
            setLayouts(allLayouts);
          }}
          compactor={undefined}
          margin={[16, 16]}
        >
          {stages.map((stageKey) => (
            <div key={stageKey} className="!overflow-visible">
              <StageColumn stageKey={stageKey} tickets={ticketsByStage[stageKey]} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
