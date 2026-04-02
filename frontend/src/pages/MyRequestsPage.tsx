import { useApp } from '../context/AppContext';
import { ClipboardList, CheckCircle2, Filter, MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function MyRequestsPage() {
  const { getDepartmentTasks, assignTicket, currentUser, language, openTicketChat } = useApp();
  const departmentTickets = getDepartmentTasks();
  const [filter, setFilter] = useState<'all' | 'waiting' | 'accepted-by-me' | 'accepted-by-others'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return departmentTickets;
    if (filter === 'waiting') return departmentTickets.filter((t) => !t.assignedTo);
    if (filter === 'accepted-by-me') return departmentTickets.filter((t) => t.assignedTo === currentUser.id);
    return departmentTickets.filter((t) => t.assignedTo && t.assignedTo !== currentUser.id);
  }, [currentUser.id, departmentTickets, filter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [filtered]
  );

  const stageBadge = (stage: string) => {
    if (stage === 'doing') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (stage === 'review') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (stage === 'done') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const stageLabel = (stage: string, accepted: boolean) => {
    if (stage === 'request' && accepted) return 'accepted';
    return stage;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <ClipboardList className="w-6 h-6 text-gold-500" />
            {language === 'th' ? 'สรุปงานของฉัน' : 'My Summary'}
          </h2>
          <p className="text-sm text-brown-500 mt-1">
            {language === 'th'
              ? `รีเควสที่เข้ามาในแผนก ${currentUser.department} ทั้งหมด ${sorted.length} รายการ`
              : `${sorted.length} incoming requests in ${currentUser.department}`}
          </p>

          <div className="mt-3 inline-flex items-center gap-2">
            <Filter className="w-4 h-4 text-brown-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-lg border border-brown-200 bg-white px-2.5 py-1.5 text-xs text-brown-700"
            >
              <option value="all">{language === 'th' ? 'ทั้งหมด' : 'All'}</option>
              <option value="waiting">{language === 'th' ? 'รอรับงาน' : 'Waiting'}</option>
              <option value="accepted-by-me">{language === 'th' ? 'ฉันรับงานแล้ว' : 'Accepted by me'}</option>
              <option value="accepted-by-others">{language === 'th' ? 'ผู้อื่นรับงานแล้ว' : 'Accepted by others'}</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-brown-300">
            <ClipboardList className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">{language === 'th' ? 'ยังไม่มีรีเควสเข้ามา' : 'No incoming requests yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((ticket) => {
              const accepted = Boolean(ticket.assignedTo);
              return (
                <div key={ticket.id} className="rounded-2xl border border-brown-100 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brown-500">{ticket.code}</p>
                      <p className="text-sm font-semibold text-brown-800 mt-0.5">{ticket.title}</p>
                      <p className="text-xs text-brown-500 mt-1 line-clamp-2">{ticket.description}</p>
                      <div className="mt-2 text-xs text-brown-600 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${stageBadge(ticket.stage)}`}>
                          {stageLabel(ticket.stage, accepted)}
                        </span>
                        <span>
                          {language === 'th' ? 'ผู้รับงาน' : 'Assignee'}: <b>{ticket.assignedToName || '-'}</b>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openTicketChat(ticket.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brown-200 text-brown-700 hover:bg-brown-50 text-xs font-semibold"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {language === 'th' ? 'เปิดแชท' : 'Open Chat'}
                      </button>

                      {!accepted ? (
                        <button
                          type="button"
                          onClick={() => assignTicket(ticket.id, currentUser.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

