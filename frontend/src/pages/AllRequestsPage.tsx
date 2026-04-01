import { useApp } from '../context/AppContext';
import { ListTodo, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

const stageLabel: Record<string, string> = {
  request: 'Request',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
};

const priorityColor: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const stageColor: Record<string, string> = {
  request: 'bg-amber-100 text-amber-700 border-amber-200',
  doing: 'bg-blue-100 text-blue-700 border-blue-200',
  review: 'bg-purple-100 text-purple-700 border-purple-200',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function AllRequestsPage() {
  const { tickets, openTicketChat } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return tickets;
    const q = searchTerm.toLowerCase();
    return tickets.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q) ||
        (t.requestorName || '').toLowerCase().includes(q) ||
        (t.ownerName || '').toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
    );
  }, [tickets, searchTerm]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <ListTodo className="w-6 h-6 text-gold-500" />
            Request ทั้งหมด
          </h2>
          <p className="text-sm text-brown-500 mt-1">
            รายการ Request ทั้งหมดในระบบ {tickets.length} รายการ
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl border border-brown-200 text-sm text-brown-700 placeholder-brown-300
              focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition w-56"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-brown-300">
          <ListTodo className="w-12 h-12 mb-3" />
          <p className="text-sm">ไม่พบ Request ที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicketChat(ticket.id)}
              className="w-full text-left rounded-2xl border border-brown-100 bg-white hover:border-brown-300 hover:shadow-md transition-all px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-brown-500">{ticket.code}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityColor[ticket.priority] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {ticket.priority.toUpperCase()}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stageColor[ticket.stage] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {stageLabel[ticket.stage] || ticket.stage}
                </span>
                <span className="text-[11px] text-brown-400">{ticket.department}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4">
                <div className="lg:col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-brown-800 line-clamp-1">{ticket.title}</p>
                  <p className="text-xs text-brown-500 mt-1 line-clamp-2">{ticket.description}</p>
                </div>

                <div className="lg:col-span-3 text-xs text-brown-600">
                  <p className="line-clamp-1"><span className="font-semibold text-brown-700">Location:</span> {ticket.location || '-'}</p>
                  <p className="line-clamp-1 mt-1"><span className="font-semibold text-brown-700">Requester:</span> {ticket.requestorName || ticket.reportedByName || '-'}</p>
                </div>

                <div className="lg:col-span-3 text-xs text-brown-600">
                  <p className="line-clamp-1"><span className="font-semibold text-brown-700">Owner:</span> {ticket.ownerName || ticket.assignedToName || '-'}</p>
                  <p className="line-clamp-1 mt-1"><span className="font-semibold text-brown-700">Updated:</span> {new Date(ticket.updatedAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="lg:col-span-2 flex lg:justify-end items-center">
                  <span className="text-[11px] text-brown-500 bg-cream-100 px-2.5 py-1 rounded-lg">เปิดแชท</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
