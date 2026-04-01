import { useApp } from '../context/AppContext';
import TicketCard from '../components/TicketCard';
import { ListTodo, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function AllRequestsPage() {
  const { tickets } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return tickets;
    const q = searchTerm.toLowerCase();
    return tickets.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ticket, idx) => (
            <TicketCard key={ticket.id} ticket={ticket} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
