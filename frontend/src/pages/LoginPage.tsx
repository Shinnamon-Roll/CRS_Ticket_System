import { useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, language } = useApp();
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : language === 'th' ? 'เข้าสู่ระบบไม่สำเร็จ' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-brown-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brown-200/50 shadow-2xl shadow-brown-900/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-brown-700 text-cream-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brown-800">CRS Login</h1>
            <p className="text-xs text-brown-500">{language === 'th' ? 'เข้าสู่ระบบด้วย Email และ Password' : 'Sign in with email and password'}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1.5">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-brown-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brown-300"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brown-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-brown-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brown-300"
              placeholder="admin"
              required
            />
          </div>

          {error ? (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brown-700 text-cream-50 py-2.5 text-sm font-semibold hover:bg-brown-800 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loading ? (language === 'th' ? 'กำลังเข้าสู่ระบบ...' : 'Signing in...') : (language === 'th' ? 'เข้าสู่ระบบ' : 'Sign in')}
          </button>
        </form>
      </div>
    </div>
  );
}
