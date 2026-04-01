import { useEffect, useMemo, useState } from 'react';
import { Building2, Pencil, Trash2, UserCog, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Department } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department_id?: number | null;
  department?: { id: number; name: string } | null;
}

interface EditingUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  departmentId: string;
}

export default function AdminManagementPage() {
  const { currentRole } = useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [newDeptName, setNewDeptName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDepartmentId, setNewUserDepartmentId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    [departments]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [deptRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/departments`),
        fetch(`${API_BASE_URL}/api/admin/users`),
      ]);

      if (!deptRes.ok || !userRes.ok) {
        throw new Error('โหลดข้อมูลจัดการระบบไม่สำเร็จ');
      }

      const deptData: Array<{ id: number; name: string }> = await deptRes.json();
      const userData: AdminUser[] = await userRes.json();

      setDepartments(deptData.map((d) => ({ id: String(d.id), name: d.name })));
      setUsers(userData);

      if (!newUserDepartmentId && deptData[0]) {
        setNewUserDepartmentId(String(deptData[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRole === 'admin') {
      void loadData();
    }
  }, [currentRole]);

  const createDepartment = async () => {
    if (!newDeptName.trim()) return;
    const res = await fetch(`${API_BASE_URL}/api/admin/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDeptName.trim() }),
    });
    if (!res.ok) throw new Error('สร้างแผนกไม่สำเร็จ');
    setNewDeptName('');
    await loadData();
  };

  const deleteDepartment = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/departments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('ลบแผนกไม่สำเร็จ');
    await loadData();
  };

  const createUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserDepartmentId) {
      throw new Error('กรุณากรอกข้อมูลผู้ใช้ให้ครบ');
    }

    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        department_id: Number(newUserDepartmentId),
        role: newUserRole,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'สร้างผู้ใช้ไม่สำเร็จ' }));
      throw new Error(err.error || 'สร้างผู้ใช้ไม่สำเร็จ');
    }

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    await loadData();
  };

  const updateUser = async () => {
    if (!editingUser) return;

    const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingUser.name.trim(),
        email: editingUser.email.trim(),
        role: editingUser.role,
        department_id: Number(editingUser.departmentId),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'แก้ไขผู้ใช้ไม่สำเร็จ' }));
      throw new Error(err.error || 'แก้ไขผู้ใช้ไม่สำเร็จ');
    }

    setEditingUser(null);
    await loadData();
  };

  const deleteUser = async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('ลบผู้ใช้ไม่สำเร็จ');
    await loadData();
  };

  if (currentRole !== 'admin') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        หน้านี้สำหรับ Admin เท่านั้น
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <UserCog className="w-6 h-6 text-gold-500" />
          จัดการแผนกและผู้ใช้งาน
        </h2>
        <p className="text-sm text-brown-500 mt-1">Admin สามารถสร้าง/ลบแผนก และจัดการข้อมูล User ในแต่ละแผนก</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="bg-white rounded-2xl border border-brown-100 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-brown-600" />
          <h3 className="text-base font-bold text-brown-800">จัดการแผนก</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="ชื่อแผนกใหม่"
            className="flex-1 rounded-xl border border-brown-200 px-3 py-2 text-sm"
          />
          <button
            onClick={() => void createDepartment().catch((e: Error) => setError(e.message))}
            className="rounded-xl bg-brown-700 text-cream-50 px-4 py-2 text-sm font-semibold hover:bg-brown-800"
          >
            เพิ่มแผนก
          </button>
        </div>

        <div className="space-y-2">
          {departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between rounded-xl border border-brown-100 px-3 py-2">
              <span className="text-sm text-brown-700">{dept.name}</span>
              <button
                onClick={() => void deleteDepartment(dept.id).catch((e: Error) => setError(e.message))}
                className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบ
              </button>
            </div>
          ))}
          {departments.length === 0 && !loading ? <p className="text-sm text-brown-400">ยังไม่มีแผนก</p> : null}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-brown-100 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-brown-600" />
          <h3 className="text-base font-bold text-brown-800">จัดการผู้ใช้งาน</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="ชื่อ" className="rounded-xl border border-brown-200 px-3 py-2 text-sm" />
          <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-brown-200 px-3 py-2 text-sm" />
          <input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Password" className="rounded-xl border border-brown-200 px-3 py-2 text-sm" />
          <select value={newUserDepartmentId} onChange={(e) => setNewUserDepartmentId(e.target.value)} className="rounded-xl border border-brown-200 px-3 py-2 text-sm">
            {departmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')} className="rounded-xl border border-brown-200 px-3 py-2 text-sm">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div className="mb-4">
          <button
            onClick={() => void createUser().catch((e: Error) => setError(e.message))}
            className="rounded-xl bg-brown-700 text-cream-50 px-4 py-2 text-sm font-semibold hover:bg-brown-800"
          >
            เพิ่มผู้ใช้งาน
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-brown-500 border-b border-brown-100">
                <th className="py-2">ชื่อ</th>
                <th className="py-2">Email</th>
                <th className="py-2">แผนก</th>
                <th className="py-2">Role</th>
                <th className="py-2 w-40">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-brown-50 text-brown-700">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.department?.name || '-'}</td>
                  <td className="py-2 uppercase text-xs">{u.role}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingUser({
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          role: u.role,
                          departmentId: String(u.department?.id || u.department_id || ''),
                        })}
                        className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-brown-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-brown-800">แก้ไขข้อมูลผู้ใช้</h4>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg hover:bg-brown-100">
                <X className="w-4 h-4 text-brown-500" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full rounded-xl border border-brown-200 px-3 py-2 text-sm" placeholder="ชื่อ" />
              <input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full rounded-xl border border-brown-200 px-3 py-2 text-sm" placeholder="Email" />
              <div className="grid grid-cols-2 gap-2">
                <select value={editingUser.departmentId} onChange={(e) => setEditingUser({ ...editingUser, departmentId: e.target.value })} className="rounded-xl border border-brown-200 px-3 py-2 text-sm">
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })} className="rounded-xl border border-brown-200 px-3 py-2 text-sm">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl border border-brown-200 text-sm">ยกเลิก</button>
              <button
                onClick={() => void updateUser().catch((e: Error) => setError(e.message))}
                className="px-4 py-2 rounded-xl bg-brown-700 text-cream-50 text-sm font-semibold hover:bg-brown-800"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-brown-200 p-5">
            <h4 className="text-lg font-bold text-brown-800 mb-2">ยืนยันการลบผู้ใช้</h4>
            <p className="text-sm text-brown-600 mb-5">
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ <span className="font-semibold">{deletingUser.name}</span> ({deletingUser.email})?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingUser(null)} className="px-4 py-2 rounded-xl border border-brown-200 text-sm">ยกเลิก</button>
              <button
                onClick={() => {
                  void deleteUser(deletingUser.id)
                    .then(() => setDeletingUser(null))
                    .catch((e: Error) => setError(e.message));
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
