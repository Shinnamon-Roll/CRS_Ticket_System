import KanbanBoard from '../components/KanbanBoard';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { tickets } = useApp();

  const stats = useMemo(() => {
    const total = tickets.length;
    const urgent = tickets.filter((t) => t.priority === 'urgent' && t.stage !== 'done').length;
    const inProgress = tickets.filter((t) => t.stage === 'doing').length;
    const completed = tickets.filter((t) => t.stage === 'done').length;
    return { total, urgent, inProgress, completed };
  }, [tickets]);

  const statCards = [
    {
      label: 'Request ทั้งหมด',
      value: stats.total,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-brown-500 to-brown-700',
      textColor: 'text-white',
    },
    {
      label: 'เร่งด่วน',
      value: stats.urgent,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'from-red-400 to-red-600',
      textColor: 'text-white',
    },
    {
      label: 'กำลังดำเนินงาน',
      value: stats.inProgress,
      icon: <Clock className="w-5 h-5" />,
      color: 'from-blue-400 to-blue-600',
      textColor: 'text-white',
    },
    {
      label: 'เสร็จสิ้นแล้ว',
      value: stats.completed,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'from-emerald-400 to-emerald-600',
      textColor: 'text-white',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brown-800" style={{ fontFamily: 'var(--font-display)' }}>
          แดชบอร์ด
        </h2>
        <p className="text-sm text-brown-500 mt-1">
          ภาพรวมสถานะงานซ่อมบำรุงทั้งหมดของระบบ
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in-up`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`${card.textColor} opacity-80`}>{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
            <p className={`text-xs ${card.textColor} opacity-70 mt-1 font-medium`}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-brown-800 mb-1">Kanban Board</h3>
        <p className="text-xs text-brown-400 mb-4">ลากการ์ดเพื่อย้ายสถานะข้ามคอลัมน์ (เฉพาะ Admin)</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
