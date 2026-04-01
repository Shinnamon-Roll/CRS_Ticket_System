import { useApp } from '../context/AppContext';
import TicketCard from '../components/TicketCard';
import { Wrench } from 'lucide-react';

export default function MyTasksPage() {
  const { tickets, currentUser } = useApp();
  const myTasks = tickets.filter((t) => t.assignedTo === currentUser.id);

  const active = myTasks.filter((t) => t.stage !== 'done');
  const completed = myTasks.filter((t) => t.stage === 'done');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Wrench className="w-6 h-6 text-gold-500" />
          งานที่ฉันรับผิดชอบ
        </h2>
        <p className="text-sm text-brown-500 mt-1">
          งานที่ได้รับมอบหมายทั้งหมด {myTasks.length} รายการ
        </p>
      </div>

      {/* Active tasks */}
      {active.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-brown-600 uppercase tracking-wider mb-3">
            กำลังดำเนินการ ({active.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((ticket, idx) => (
              <TicketCard key={ticket.id} ticket={ticket} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-brown-600 uppercase tracking-wider mb-3">
            เสร็จสิ้นแล้ว ({completed.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
            {completed.map((ticket, idx) => (
              <TicketCard key={ticket.id} ticket={ticket} index={idx} />
            ))}
          </div>
        </div>
      )}

      {myTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-brown-300">
          <Wrench className="w-12 h-12 mb-3" />
          <p className="text-sm">ยังไม่มีงานที่ได้รับมอบหมาย</p>
        </div>
      )}
    </div>
  );
}
