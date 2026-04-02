import { useApp } from '../context/AppContext';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  BarChart3,
  Settings,
  ClipboardList,
  UserCog,
  Settings2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { stageConfig } from '../data/mockData';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: ('admin' | 'user')[];
}

export default function Sidebar() {
  const { currentRole, sidebarOpen, tickets, currentUser, language } = useApp();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { path: '/', label: language === 'th' ? 'แดชบอร์ด' : 'Dashboard', icon: <LayoutDashboard className="w-4.5 h-4.5" />, roles: ['admin'] },
    { path: '/requests', label: language === 'th' ? 'Request ทั้งหมด' : 'All Requests', icon: <ListTodo className="w-4.5 h-4.5" />, roles: ['admin'] },
    { path: '/stats', label: language === 'th' ? 'สถิติ' : 'Statistics', icon: <BarChart3 className="w-4.5 h-4.5" />, roles: ['admin', 'user'] },
    { path: '/admin/management', label: language === 'th' ? 'จัดการแผนกและผู้ใช้' : 'Departments & Users', icon: <UserCog className="w-4.5 h-4.5" />, roles: ['admin'] },
    { path: '/admin/setup', label: language === 'th' ? 'Admin Setup' : 'Admin Setup', icon: <Settings2 className="w-4.5 h-4.5" />, roles: ['admin'] },
    { path: '/my-requests', label: language === 'th' ? 'สรุปงานของฉัน' : 'My Summary', icon: <ClipboardList className="w-4.5 h-4.5" />, roles: ['user'] },
    { path: '/new-request', label: language === 'th' ? 'Ticket ของฉัน' : 'My Ticket', icon: <PlusCircle className="w-4.5 h-4.5" />, roles: ['user'] },
    { path: '/settings', label: language === 'th' ? 'ตั้งค่า' : 'Settings', icon: <Settings className="w-4.5 h-4.5" />, roles: ['admin', 'user'] },
  ];

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
            {language === 'th' ? 'เมนูหลัก' : 'Main Menu'}
          </p>
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/stage/'));
            return (
              <Link
                key={item.path}
                id={`nav-${item.path.replace('/', '')}`}
                to={item.path}
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
              </Link>
            );
          })}
        </nav>

        {currentRole === 'user' && (
          <div className="border-t border-cream-200 p-3">
            <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-brown-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {language === 'th' ? `งานปัจจุบัน (${activeTasks.length})` : `Active Tasks (${activeTasks.length})`}
            </p>

            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {activeTasks.length === 0 ? (
                <p className="px-3 py-2 text-xs text-brown-400 italic">{language === 'th' ? 'ไม่มีงานที่กำลังดำเนินการ' : 'No active tasks'}</p>
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
        )}

        {/* Footer */}
        <div className="p-3 border-t border-cream-200">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-cream-200/60 to-cream-100/60">
            <p className="text-[10px] text-brown-400 uppercase tracking-wider">{language === 'th' ? 'แผนก' : 'Department'}</p>
            <p className="text-xs font-medium text-brown-700 truncate">{currentUser.department}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
