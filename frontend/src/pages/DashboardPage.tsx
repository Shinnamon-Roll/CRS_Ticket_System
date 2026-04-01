import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';

export default function DashboardPage() {
  const { tickets } = useApp();

  const summary = useMemo(() => {
    const total = tickets.length;
    const urgent = tickets.filter((t) => t.priority === 'urgent' && t.stage !== 'done').length;
    const inProgress = tickets.filter((t) => t.stage === 'doing').length;
    const completed = tickets.filter((t) => t.stage === 'done').length;

    const stageData = [
      { name: 'Request', value: tickets.filter((t) => t.stage === 'request').length },
      { name: 'Doing', value: tickets.filter((t) => t.stage === 'doing').length },
      { name: 'Review', value: tickets.filter((t) => t.stage === 'review').length },
      { name: 'Done', value: tickets.filter((t) => t.stage === 'done').length },
    ];

    const priorityData = [
      { name: 'Urgent', value: tickets.filter((t) => t.priority === 'urgent').length },
      { name: 'High', value: tickets.filter((t) => t.priority === 'high').length },
      { name: 'Medium', value: tickets.filter((t) => t.priority === 'medium').length },
      { name: 'Low', value: tickets.filter((t) => t.priority === 'low').length },
    ];

    const byDepartmentMap = tickets.reduce<Record<string, number>>((acc, t) => {
      const key = t.department || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byDepartment = Object.entries(byDepartmentMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    const latestLogs = [...tickets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);

    return { total, urgent, inProgress, completed, stageData, priorityData, byDepartment, latestLogs };
  }, [tickets]);

  const cards = [
    { label: 'Request ทั้งหมด', value: summary.total, icon: <TrendingUp className="w-5 h-5" />, color: 'from-brown-500 to-brown-700' },
    { label: 'เร่งด่วน', value: summary.urgent, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-red-400 to-red-600' },
    { label: 'กำลังดำเนินงาน', value: summary.inProgress, icon: <Clock className="w-5 h-5" />, color: 'from-blue-400 to-blue-600' },
    { label: 'เสร็จสิ้นแล้ว', value: summary.completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'from-emerald-400 to-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown-800" style={{ fontFamily: 'var(--font-display)' }}>แดชบอร์ดผู้ดูแลระบบ</h2>
        <p className="text-sm text-brown-500 mt-1">สรุปภาพรวมงานทั้งหมด ทั้งสถิติและกราฟ อยู่ในหน้าเดียว</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 shadow-lg animate-fade-in-up`} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="text-white/80 mb-2">{card.icon}</div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/80 mt-1 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-brown-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-brown-800 mb-3">งานตามแผนก</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2e9db" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#96744A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-brown-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-brown-800 mb-3">สถานะงาน</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.stageData} dataKey="value" nameKey="name" outerRadius={90} fill="#B08D5B" label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 bg-white border border-brown-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-brown-800 mb-3">Priority Distribution</h3>
          <div className="space-y-2">
            {summary.priorityData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-cream-100 px-3 py-2 text-sm">
                <span className="text-brown-700">{item.name}</span>
                <span className="font-semibold text-brown-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-brown-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-brown-800 mb-3">อัปเดตล่าสุด</h3>
          <div className="space-y-2">
            {summary.latestLogs.map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-brown-100 px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brown-800 truncate">{ticket.code} - {ticket.title}</p>
                  <p className="text-xs text-brown-500 truncate">{ticket.department} | {ticket.stage.toUpperCase()} | {ticket.priority.toUpperCase()}</p>
                </div>
                <span className="text-[11px] text-brown-400 whitespace-nowrap">
                  {new Date(ticket.updatedAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {summary.latestLogs.length === 0 ? <p className="text-sm text-brown-400">ยังไม่มีข้อมูล</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
