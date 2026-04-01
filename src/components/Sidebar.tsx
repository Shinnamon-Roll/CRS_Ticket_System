import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  BarChart3,
  Settings,
  ClipboardList,
  Wrench,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { stageConfig } from '../data/mockData';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: ('admin' | 'user')[];
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: <LayoutDashboard className="w-4.5 h-4.5" />, roles: ['admin'] },
  { id: 'all-requests', label: 'Request ทั้งหมด', icon: <ListTodo className="w-4.5 h-4.5" />, roles: ['admin'] },
  { id: 'my-tasks', label: 'งานที่ฉันรับผิดชอบ', icon: <Wrench className="w-4.5 h-4.5" />, roles: ['admin'] },
  { id: 'statistics', label: 'สถิติ', icon: <BarChart3 className="w-4.5 h-4.5" />, roles: ['admin'] },
  { id: 'my-requests', label: 'สรุปงานของฉัน', icon: <ClipboardList className="w-4.5 h-4.5" />, roles: ['user'] },
  { id: 'new-request', label: 'ส่ง Request ใหม่', icon: <PlusCircle className="w-4.5 h-4.5" />, roles: ['user'] },
  { id: 'settings', label: 'ตั้งค่า', icon: <Settings className="w-4.5 h-4.5" />, roles: ['admin', 'user'] },
];

export default function Sidebar() {
  const { currentRole, activePage, setActivePage, sidebarOpen, tickets, currentUser } = useApp();

  const filteredMenu = menuItems.filter((item) => item.roles.includes(currentRole));

  // Active tasks for this user
  const activeTasks = tickets.filter((t) => {
    if (currentRole === 'admin') {
      return t.assignedTo === currentUser.id && t.stage !== 'done';
    }
    return t.reportedBy === currentUser.id && t.stage !== 'done';
  });

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-400';
  };

  const getStageLabel = (stageKey: string) => {
    const stage = stageConfig.find((s) => s.key === stageKey);
    return stage?.label || stageKey;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-brown-900/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => {}}
        />
      )}

      <aside
        className={`fixed top-16 left-0 bottom-0 z-30 w-64 bg-white/90 backdrop-blur-xl border-r border-brown-100/40
          transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-brown-400">
            เมนูหลัก
          </p>
          {filteredMenu.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-brown-700 to-brown-600 text-cream-100 shadow-lg shadow-brown-700/20'
                      : 'text-brown-600 hover:bg-cream-200/60 hover:text-brown-800'
                  }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Active Tasks Section */}
        <div className="border-t border-cream-200 p-3">
          <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-brown-400 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            งานปัจจุบัน ({activeTasks.length})
          </p>

          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {activeTasks.length === 0 ? (
              <p className="px-3 py-2 text-xs text-brown-400 italic">ไม่มีงานที่กำลังดำเนินการ</p>
            ) : (
              activeTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-cream-100/50 hover:bg-cream-200/60 transition-colors cursor-pointer group"
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${getPriorityDot(task.priority)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-brown-700 truncate group-hover:text-brown-800">
                      {task.code}
                    </p>
                    <p className="text-[11px] text-brown-500 truncate">{task.title}</p>
                    <p className="text-[10px] text-brown-400 mt-0.5">{getStageLabel(task.stage)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cream-200">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-cream-200/60 to-cream-100/60">
            <p className="text-[10px] text-brown-400 uppercase tracking-wider">แผนก</p>
            <p className="text-xs font-medium text-brown-700 truncate">{currentUser.department}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
