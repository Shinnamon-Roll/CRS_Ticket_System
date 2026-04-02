import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Priority } from '../types';
import { PlusCircle, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const { currentUser, createTicket, departments } = useApp();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    category: categories[0],
    priority: 'medium' as Priority,
    departmentId: '',
    image: null as File | null,
  });

  const submitForm = () => {
    const formElement = document.querySelector('form') as HTMLFormElement | null;
    formElement?.requestSubmit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      await createTicket({
        title: `${form.category}: ${form.title}`,
        description: form.description,
        location: form.location,
        priority: form.priority,
        requesterId: currentUser.id,
        departmentId: form.departmentId,
        image: form.image,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        navigate('/my-requests');
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'ไม่สามารถส่ง Request ได้');
    } finally {
      setSubmitting(false);
    }
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
          กรอกรายละเอียดปัญหา ระบบจะสร้าง Ticket ID ให้อัตโนมัติสำหรับค้นหา
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-brown-100/60 p-6 shadow-sm space-y-5"
      >
        {/* Title */}
        <div>
          <label htmlFor="req-title" className="block text-sm font-semibold text-brown-700 mb-1.5">
            รายละเอียดคำขอ (Top Down) <span className="text-red-500">*</span>
          </label>
          <input
            id="req-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="เช่น เครื่องปรับอากาศชั้น 2 โซน A ไม่เย็น"
            className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800 placeholder-brown-300
              focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="req-location" className="block text-sm font-semibold text-brown-700 mb-1.5">
            สถานที่ (Location) <span className="text-red-500">*</span>
          </label>
          <input
            id="req-location"
            type="text"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="เช่น ตึก A ชั้น 2 ห้อง 205"
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

        {/* Department selector */}
        <div>
          <label htmlFor="req-department" className="block text-sm font-semibold text-brown-700 mb-1.5">
            ส่งไปยังแผนก <span className="text-red-500">*</span>
          </label>
          <select
            id="req-department"
            required
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800
              focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition bg-white"
          >
            <option value="">-- เลือกแผนก --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitForm();
              }
            }}
            placeholder="อธิบายรายละเอียดของปัญหา สถานที่ และอาการที่พบ..."
            className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-800 placeholder-brown-300
              focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition resize-none"
          />
        </div>

        {/* Image */}
        <div>
          <label htmlFor="req-image" className="block text-sm font-semibold text-brown-700 mb-1.5">
            รูปภาพประกอบ (ไม่บังคับ)
          </label>
          <input
            id="req-image"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
            className="w-full rounded-xl border border-brown-200 px-4 py-2.5 text-sm text-brown-700
              file:mr-3 file:rounded-lg file:border-0 file:bg-cream-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brown-700"
          />
        </div>

        {/* Department (auto) */}
        <div className="flex items-center gap-2 px-4 py-3 bg-cream-100 rounded-xl">
          <span className="text-xs text-brown-500">ผู้แจ้ง / แผนก:</span>
          <span className="text-xs font-semibold text-brown-700">{currentUser.name}</span>
          <span className="text-xs text-brown-400">-</span>
          <span className="text-xs font-semibold text-brown-700">{currentUser.department}</span>
        </div>

        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-gradient-to-r from-brown-600 to-brown-700 hover:from-brown-700 hover:to-brown-800
            text-cream-100 font-semibold text-sm shadow-lg shadow-brown-700/20
            transition-all duration-300 hover:shadow-xl hover:shadow-brown-700/30 active:scale-[0.98] disabled:opacity-70"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'กำลังส่ง...' : 'ส่ง Request'}
        </button>
      </form>
    </div>
  );
}
