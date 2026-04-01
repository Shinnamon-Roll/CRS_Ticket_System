import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Ticket, Priority } from '../types';
import { PlusCircle, Send, CheckCircle } from 'lucide-react';

const categories = [
  'ระบบปรับอากาศ',
  'ระบบประปา',
  'ระบบไฟฟ้า',
  'ลิฟต์/บันไดเลื่อน',
  'อุปกรณ์เครื่องใช้ไฟฟ้า',
  'ระบบกุญแจ/ล็อค',
  'ระบบระบายอากาศ',
  'ระบบดับเพลิง',
  'ระบบเครือข่าย/IT',
  'งานช่างทั่วไป',
];

export default function NewRequestPage() {
  const { currentUser, tickets, setTickets, setActivePage } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0],
    priority: 'medium' as Priority,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: `t${Date.now()}`,
      code: `CRS-2026-${String(tickets.length + 1).padStart(3, '0')}`,
      title: form.title,
      description: form.description,
      department: currentUser.department,
      reportedBy: currentUser.id,
      reportedByName: `${currentUser.name.split(' ')[0]} ${currentUser.name.split(' ')[1]?.charAt(0) || ''}.`,
      priority: form.priority,
      stage: 'request',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: form.category,
    };
    setTickets((prev) => [newTicket, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActivePage('my-requests');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-brown-800 mb-2">ส่ง Request สำเร็จ!</h3>
        <p className="text-sm text-brown-500">กำลังนำคุณไปที่หน้าสรุปงาน...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <PlusCircle className="w-6 h-6 text-gold-500" />
          ส่ง Request ใหม่
        </h2>
        <p className="text-sm text-brown-500 mt-1">
          กรอกรายละเอียดปัญหาที่ต้องการแจ้งซ่อม
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-brown-100/60 p-6 shadow-sm space-y-5"
      >
        {/* Title */}
        <div>
          <label htmlFor="req-title" className="block text-sm font-semibold text-brown-700 mb-1.5">
            หัวข้อปัญหา <span className="text-red-500">*</span>
          </label>
          <input
            id="req-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="เช่น เครื่องปรับอากาศห้อง 305 ไม่เย็น"
            className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800 placeholder-brown-300
              focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition"
          />
        </div>

        {/* Category + Priority row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="req-category" className="block text-sm font-semibold text-brown-700 mb-1.5">
              หมวดหมู่
            </label>
            <select
              id="req-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800
                focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-priority" className="block text-sm font-semibold text-brown-700 mb-1.5">
              ระดับความสำคัญ
            </label>
            <select
              id="req-priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800
                focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition bg-white"
            >
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
              <option value="urgent">เร่งด่วน</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="req-desc" className="block text-sm font-semibold text-brown-700 mb-1.5">
            รายละเอียดปัญหา <span className="text-red-500">*</span>
          </label>
          <textarea
            id="req-desc"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="อธิบายรายละเอียดของปัญหา สถานที่ และอาการที่พบ..."
            className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800 placeholder-brown-300
              focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition resize-none"
          />
        </div>

        {/* Department (auto) */}
        <div className="flex items-center gap-2 px-4 py-3 bg-cream-100 rounded-xl">
          <span className="text-xs text-brown-500">แผนกที่แจ้ง:</span>
          <span className="text-xs font-semibold text-brown-700">{currentUser.department}</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-gradient-to-r from-brown-600 to-brown-700 hover:from-brown-700 hover:to-brown-800
            text-cream-100 font-semibold text-sm shadow-lg shadow-brown-700/20
            transition-all duration-300 hover:shadow-xl hover:shadow-brown-700/30 active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          ส่ง Request
        </button>
      </form>
    </div>
  );
}
