import { useApp } from '../context/AppContext';
import TicketCard from '../components/TicketCard';
import { stageConfig } from '../data/mockData';
import { ClipboardList, Filter, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { TicketStage } from '../types';

export default function MyRequestsPage() {
  const { getUserTickets, cancelTicket, language } = useApp();
  const userTickets = getUserTickets();
  const [filterStage, setFilterStage] = useState<TicketStage | 'all'>('all');

  const pendingReview = useMemo(
    () => userTickets.filter((t) => t.stage === 'review'),
    [userTickets]
  );

  const filtered = useMemo(() => {
    if (filterStage === 'all') return userTickets;
    return userTickets.filter((t) => t.stage === filterStage);
  }, [userTickets, filterStage]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Pending Review Section */}
      {pendingReview.length > 0 && (
        <section className="bg-red-50/50 rounded-2xl p-5 border border-red-200/50">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <AlertCircle className="w-5 h-5" />
            {language === 'th' ? 'งานที่รอการรีวิวจากคุณ (Pending Your Review)' : 'Pending Your Review'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingReview.map((ticket) => (
              <TicketCard key={`review-${ticket.id}`} ticket={ticket} />
            ))}
          </div>
        </section>
      )}

      {/* All Requests Section */}
      <section>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <ClipboardList className="w-6 h-6 text-gold-500" />
              ประวัติงานแจ้งซ่อม / IT Helpdesk
            </h2>
            <p className="text-sm text-brown-500 mt-1">
              {language === 'th' ? `Request ที่คุณส่งเข้ามาทั้งหมด ${userTickets.length} รายการ` : `You created ${userTickets.length} requests`}
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
              <option value="all">{language === 'th' ? 'ทุกสถานะ' : 'All stages'}</option>
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
            <ClipboardList className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">{language === 'th' ? 'ไม่มี Request ในสถานะนี้' : 'No requests in this stage'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="space-y-2">
                <TicketCard ticket={ticket} />
                {ticket.stage !== 'done' && (
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm(
                        language === 'th'
                          ? `ยืนยันยกเลิก Ticket ${ticket.code}?`
                          : `Cancel ticket ${ticket.code}?`
                      );
                      if (!confirmed) return;
                      void cancelTicket(ticket.id);
                    }}
                    className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    {language === 'th' ? 'ยกเลิก Ticket นี้' : 'Cancel Ticket'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

