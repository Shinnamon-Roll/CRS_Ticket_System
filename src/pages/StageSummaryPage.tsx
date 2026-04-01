import { useParams, Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { stageConfig } from '../data/mockData';
import { ArrowLeft, Inbox } from 'lucide-react';
import TicketCard from '../components/TicketCard';
import type { TicketStage } from '../types';

export default function StageSummaryPage() {
  const { statusId } = useParams<{ statusId: string }>();
  const { getTicketsByStage } = useApp();

  const stageInfo = stageConfig.find((s) => s.key === statusId);

  if (!stageInfo) {
    return <Navigate to="/" replace />;
  }

  const tickets = getTicketsByStage(statusId as TicketStage);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Area */}
      <div className="flex items-center gap-4 border-b border-brown-200/50 pb-5">
        <Link
          to="/"
          className="p-2 rounded-xl text-brown-500 hover:text-brown-800 hover:bg-cream-200 transition-colors"
          title="กลับไปหน้าแดชบอร์ด"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] tracking-tight text-brown-800 flex items-center gap-2">
            สรุปงานสถานะ: <span className={stageInfo.color}>{stageInfo.label}</span>
          </h1>
          <p className="text-sm text-brown-500 mt-1">
            รายการทำงานทั้งหมดที่อยู่ในสถานะนี้ ({tickets.length} รายการ)
          </p>
        </div>
      </div>

      {/* Content Area */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 rounded-3xl border border-dashed border-brown-200 bg-white/50">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mb-4 text-brown-400">
            <Inbox className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-brown-700">ไม่มีรายการในสถานะนี้</h3>
          <p className="text-brown-500 text-sm mt-1 text-center max-w-sm">
            ปัจจุบันยังไม่มี Ticket ใดๆ ถูกระบุอยู่ในสถานะ {stageInfo.label}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="h-full">
              <TicketCard ticket={ticket} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
