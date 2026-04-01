import { useApp } from '../context/AppContext';
import TicketCard from '../components/TicketCard';
import { stageConfig } from '../data/mockData';
import { ClipboardList, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { TicketStage } from '../types';

export default function MyRequestsPage() {
  const { getUserTickets } = useApp();
  const userTickets = getUserTickets();
  const [filterStage, setFilterStage] = useState<TicketStage | 'all'>('all');

  const filtered = useMemo(() => {
    if (filterStage === 'all') return userTickets;
    return userTickets.filter((t) => t.stage === filterStage);
  }, [userTickets, filterStage]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <ClipboardList className="w-6 h-6 text-gold-500" />
            สรุปงานของฉัน
          </h2>
          <p className="text-sm text-brown-500 mt-1">
            Request ที่คุณส่งเข้ามาทั้งหมด {userTickets.length} รายการ
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brown-400" />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value as TicketStage | 'all')}
            className="text-sm rounded-xl border border-brown-200 bg-white px-3 py-2 text-brown-700 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
          >
            <option value="all">ทุกสถานะ</option>
            {stageConfig.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-brown-300">
          <ClipboardList className="w-12 h-12 mb-3" />
          <p className="text-sm">ไม่มี Request ในสถานะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ticket, idx) => (
            <TicketCard key={ticket.id} ticket={ticket} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
