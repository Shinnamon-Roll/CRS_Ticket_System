import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import MyRequestsPage from './pages/MyRequestsPage';
import NewRequestPage from './pages/NewRequestPage';
import AllRequestsPage from './pages/AllRequestsPage';
import MyTasksPage from './pages/MyTasksPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import { useApp } from './context/AppContext';

function PageRouter() {
  const { activePage } = useApp();

  const pages: Record<string, React.ReactNode> = {
    'dashboard': <DashboardPage />,
    'all-requests': <AllRequestsPage />,
    'my-tasks': <MyTasksPage />,
    'statistics': <StatisticsPage />,
    'my-requests': <MyRequestsPage />,
    'new-request': <NewRequestPage />,
    'settings': <SettingsPage />,
  };

  return (
    <div className="animate-fade-in-up" key={activePage}>
      {pages[activePage] || <DashboardPage />}
    </div>
  );
}

export default function App() {
  const { sidebarOpen } = useApp();

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
          <PageRouter />
        </div>
      </main>
    </div>
  );
}
