import { useApp } from '../context/AppContext';
import {
  Bell,
  Menu,
  ArrowRightLeft,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const {
    currentUser,
    currentRole,
    switchRole,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    sidebarOpen,
    setSidebarOpen,
  } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifs on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-brown-200/40 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-cream-200/60 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-brown-700" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-brown-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm font-[var(--font-display)]">C</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold text-brown-800 tracking-tight leading-tight">
              CRS Ticket System
            </h1>
            <p className="text-[10px] text-brown-400 tracking-wider uppercase">
              Concierge Request Service
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Role Switcher */}
        <button
          id="role-switcher"
          onClick={switchRole}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
            bg-gradient-to-r from-cream-200 to-cream-300 hover:from-cream-300 hover:to-cream-400
            text-brown-700 transition-all duration-300 group border border-brown-200/30"
          title="สลับบทบาท (Switch Role)"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-500" />
          <span className="hidden sm:inline">สลับ</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notification-bell"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl hover:bg-cream-200/60 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-brown-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-glow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-brown-100/50 overflow-hidden animate-fade-in-up z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-cream-200">
                <h3 className="font-semibold text-brown-800 text-sm">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-gold-600 hover:text-gold-500 font-medium"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-brown-400">ไม่มีการแจ้งเตือน</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-cream-100 hover:bg-cream-50 transition-colors ${
                        !n.read ? 'bg-gold-300/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                        )}
                        <div className={!n.read ? '' : 'pl-4'}>
                          <p className="text-xs font-semibold text-brown-700">{n.title}</p>
                          <p className="text-xs text-brown-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-brown-400 mt-1">
                            {new Date(n.timestamp).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <div
          id="user-info"
          className="flex items-center gap-2.5 pl-2 ml-1 border-l border-brown-200/30"
        >
          <div className="hidden sm:block text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  currentRole === 'admin'
                    ? 'bg-brown-700 text-cream-100'
                    : 'bg-gold-400 text-brown-800'
                }`}
              >
                {currentRole === 'admin' ? (
                  <Shield className="w-2.5 h-2.5" />
                ) : (
                  <UserIcon className="w-2.5 h-2.5" />
                )}
                {currentRole === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
            <p className="text-xs font-medium text-brown-700 mt-0.5">{currentUser.name}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {currentUser.nameEn.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
