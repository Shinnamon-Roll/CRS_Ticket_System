import { useApp } from '../context/AppContext';
import {
  Bell,
  Menu,
  LogOut,
  Shield,
  User as UserIcon,
  X,
  AlertTriangle,
  Languages,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Notification } from '../types';

export default function Header() {
  const {
    currentUser,
    currentRole,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    language,
    toggleLanguage,
    sidebarOpen,
    setSidebarOpen,
  } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showConfirmAllRead, setShowConfirmAllRead] = useState(false);
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
        {/* Logout */}
        <button
          id="logout-button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium
            bg-gradient-to-r from-cream-200 to-cream-300 hover:from-cream-300 hover:to-cream-400
            text-brown-700 transition-all duration-300 group border border-brown-200/30"
          title={language === 'th' ? 'ออกจากระบบ' : 'Logout'}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
        </button>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-brown-200/40 text-brown-700 hover:bg-cream-200/60"
          title={language === 'th' ? 'เปลี่ยนภาษา' : 'Switch language'}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{language.toUpperCase()}</span>
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
                <h3 className="font-semibold text-brown-800 text-sm">{language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setShowConfirmAllRead(true)}
                    className="text-xs text-gold-600 hover:text-gold-500 font-medium"
                  >
                    {language === 'th' ? 'อ่านทั้งหมด' : 'Read all'}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-brown-400">{language === 'th' ? 'ไม่มีการแจ้งเตือน' : 'No notifications'}</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNotification(n)}
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

      {selectedNotification && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-brown-900/35 backdrop-blur-sm"
            aria-label="close notification detail"
            onClick={() => {
              markNotificationRead(selectedNotification.id);
              setSelectedNotification(null);
            }}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-brown-200 bg-white shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-brown-500">{language === 'th' ? 'รายละเอียดการแจ้งเตือน' : 'Notification detail'}</p>
                <h3 className="text-lg font-bold text-brown-800 mt-1">{selectedNotification.title}</h3>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg text-brown-500 hover:bg-brown-100 hover:text-brown-700"
                onClick={() => {
                  markNotificationRead(selectedNotification.id);
                  setSelectedNotification(null);
                }}
                aria-label="close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-brown-700 leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
            <div className="mt-4 text-xs text-brown-500 flex items-center justify-between">
              <span>
                {new Date(selectedNotification.timestamp).toLocaleString('th-TH', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
              {selectedNotification.ticketCode ? <span>{selectedNotification.ticketCode}</span> : null}
            </div>
          </div>
        </div>
      )}

      {showConfirmAllRead && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-brown-900/35 backdrop-blur-sm"
            aria-label="close confirm"
            onClick={() => setShowConfirmAllRead(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-brown-200 bg-white shadow-2xl p-5">
            <div className="flex items-center gap-2 text-amber-700 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">{language === 'th' ? 'ยืนยันอ่านทั้งหมด' : 'Confirm clear all'}</h3>
            </div>
            <p className="text-sm text-brown-700">{language === 'th' ? 'ต้องการลบการแจ้งเตือนทั้งหมดใช่หรือไม่?' : 'Do you want to remove all notifications?'}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmAllRead(false)}
                className="px-3 py-2 text-sm rounded-lg border border-brown-200 text-brown-600 hover:bg-brown-50"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  markAllRead();
                  setShowConfirmAllRead(false);
                  setShowNotifs(false);
                }}
                className="px-3 py-2 text-sm rounded-lg bg-brown-700 text-cream-50 hover:bg-brown-800"
              >
                {language === 'th' ? 'ยืนยัน' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
