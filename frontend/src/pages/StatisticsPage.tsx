import { useApp } from '../context/AppContext';
import { useMemo } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { stageConfig } from '../data/mockData';
import type { Priority } from '../types';

export default function StatisticsPage() {
  const { tickets } = useApp();

  const stats = useMemo(() => {
    const byStage = stageConfig.map((s) => ({
      ...s,
      count: tickets.filter((t) => t.stage === s.key).length,
    }));

    const byPriority: { key: Priority; label: string; count: number; color: string }[] = [
      { key: 'urgent', label: 'เร่งด่วน', count: tickets.filter((t) => t.priority === 'urgent').length, color: 'bg-red-500' },
      { key: 'high', label: 'สูง', count: tickets.filter((t) => t.priority === 'high').length, color: 'bg-orange-500' },
      { key: 'medium', label: 'ปานกลาง', count: tickets.filter((t) => t.priority === 'medium').length, color: 'bg-yellow-500' },
      { key: 'low', label: 'ต่ำ', count: tickets.filter((t) => t.priority === 'low').length, color: 'bg-green-500' },
    ];

    const byLocation = tickets.reduce<Record<string, number>>((acc, t) => {
      const key = t.location || 'ไม่ระบุสถานที่';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const sortedLocations = Object.entries(byLocation)
      .sort(([, a], [, b]) => b - a);

    return { byStage, byPriority, sortedLocations };
  }, [tickets]);

  const maxLocationCount = Math.max(...stats.sortedLocations.map(([, c]) => c), 1);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <BarChart3 className="w-6 h-6 text-gold-500" />
          สถิติ
        </h2>
        <p className="text-sm text-brown-500 mt-1">ภาพรวมข้อมูลเชิงสถิติของ Request ในระบบ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Stage */}
        <div className="bg-white rounded-2xl border border-brown-100/60 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-brown-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brown-400" />
            ตามสถานะ
          </h3>
          <div className="space-y-3">
            {stats.byStage.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-28 ${s.color}`}>{s.label}</span>
                <div className="flex-1 h-6 bg-cream-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${s.bgColor} ${s.borderColor} border rounded-lg transition-all duration-700 flex items-center px-2`}
                    style={{ width: `${tickets.length ? (s.count / tickets.length) * 100 : 0}%`, minWidth: s.count > 0 ? '2rem' : '0' }}
                  >
                    <span className={`text-[10px] font-bold ${s.color}`}>{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white rounded-2xl border border-brown-100/60 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-brown-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brown-400" />
            ตามระดับความสำคัญ
          </h3>
          <div className="space-y-3">
            {stats.byPriority.map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 text-brown-600">{p.label}</span>
                <div className="flex-1 h-6 bg-cream-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${p.color} rounded-lg transition-all duration-700 flex items-center px-2 opacity-80`}
                    style={{ width: `${tickets.length ? (p.count / tickets.length) * 100 : 0}%`, minWidth: p.count > 0 ? '2rem' : '0' }}
                  >
                    <span className="text-[10px] font-bold text-white">{p.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Location */}
        <div className="bg-white rounded-2xl border border-brown-100/60 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-brown-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brown-400" />
            ตามสถานที่ (Location)
          </h3>
          <div className="space-y-2">
            {stats.sortedLocations.map(([location, count]) => (
              <div key={location} className="flex items-center gap-3">
                <span className="text-xs font-medium w-40 text-brown-600 truncate">{location}</span>
                <div className="flex-1 h-5 bg-cream-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-400 to-brown-400 rounded-lg transition-all duration-700 flex items-center px-2"
                    style={{ width: `${(count / maxLocationCount) * 100}%`, minWidth: '1.5rem' }}
                  >
                    <span className="text-[10px] font-bold text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
