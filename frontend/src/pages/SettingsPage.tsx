import { Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { currentUser, currentRole } = useApp();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Settings className="w-6 h-6 text-gold-500" />
          ตั้งค่า
        </h2>
        <p className="text-sm text-brown-500 mt-1">จัดการข้อมูลส่วนตัวและการตั้งค่าระบบ</p>
      </div>

      <div className="bg-white rounded-2xl border border-brown-100/60 p-6 shadow-sm space-y-6">
        {/* Profile */}
        <div>
          <h3 className="text-sm font-bold text-brown-700 mb-3 uppercase tracking-wider">ข้อมูลผู้ใช้</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-cream-200">
              <span className="text-sm text-brown-500">ชื่อ-นามสกุล</span>
              <span className="text-sm font-semibold text-brown-800">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-cream-200">
              <span className="text-sm text-brown-500">บทบาท</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                currentRole === 'admin' ? 'bg-brown-700 text-cream-100' : 'bg-gold-400 text-brown-800'
              }`}>
                {currentRole === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-cream-200">
              <span className="text-sm text-brown-500">แผนก</span>
              <span className="text-sm font-semibold text-brown-800">{currentUser.department}</span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-bold text-brown-700 mb-3 uppercase tracking-wider">การตั้งค่า</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-brown-700 font-medium">การแจ้งเตือน</span>
                <p className="text-xs text-brown-400">รับการแจ้งเตือนเมื่อมี Request ใหม่</p>
              </div>
              <div className="w-11 h-6 bg-gold-400 rounded-full relative cursor-pointer transition-colors">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-brown-700 font-medium">ภาษา</span>
                <p className="text-xs text-brown-400">เลือกภาษาที่ใช้แสดงผล</p>
              </div>
              <span className="text-sm font-medium text-brown-600 px-3 py-1 bg-cream-100 rounded-lg">ไทย</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
