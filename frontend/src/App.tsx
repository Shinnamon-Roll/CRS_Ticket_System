import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import MyRequestsPage from './pages/MyRequestsPage';
import NewRequestPage from './pages/NewRequestPage';
import AllRequestsPage from './pages/AllRequestsPage';
import MyTasksPage from './pages/MyTasksPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import StageSummaryPage from './pages/StageSummaryPage';
import TicketChatWidget from './components/TicketChatWidget';
import LoginPage from './pages/LoginPage';
import { useApp } from './context/AppContext';

export default function App() {
  const { sidebarOpen, currentRole, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Header />
      <Sidebar />

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : ''
        }`}
      >
        <div className="p-4 lg:p-6 xl:p-8">
          <Routes>
            <Route path="/" element={currentRole === 'admin' ? <DashboardPage /> : <Navigate to="/my-requests" />} />
            <Route path="/requests" element={<AllRequestsPage />} />
            <Route path="/tasks" element={<MyTasksPage />} />
            <Route path="/stats" element={<StatisticsPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/new-request" element={<NewRequestPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/stage/:statusId" element={<StageSummaryPage />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <TicketChatWidget />
    </div>
  );
}

