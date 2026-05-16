import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Bookings } from './pages/Bookings';
import { Clients } from './pages/Clients';
import { Invoices } from './pages/Invoices';
import { Expenses } from './pages/Expenses';
import { Settings } from './pages/Settings';
import type { PageId } from './types';

function WelcomeOverlay({ onEnter }: { onEnter: () => void }) {
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(onEnter, 700);
  };

  return (
    <div className={`splash-overlay ${isExiting ? 'exiting' : ''}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className={`relative z-10 text-center transition-all duration-700 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30">
          <span className="text-3xl font-bold text-white">T</span>
        </div>
        <h1 className="splash-title mb-2">Welcome Back, Joel</h1>
        <p className="splash-subtitle">Your cloud dashboard is ready</p>
        <button onClick={handleEnter} className="splash-button group">
          <span className="relative z-10 flex items-center gap-2">
            <svg className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ENTER
          </span>
        </button>
      </div>
    </div>
  );
}

function PageRouter({ currentPage }: { currentPage: PageId }) {
  const pages: Record<PageId, React.ReactNode> = {
    dashboard: <Dashboard />,
    inventory: <Inventory />,
    bookings: <Bookings />,
    clients: <Clients />,
    invoices: <Invoices />,
    expenses: <Expenses />,
    settings: <Settings />,
  };

  return pages[currentPage] || <Dashboard />;
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  const colors = {
    success: 'border-emerald-500/30 text-emerald-400',
    error: 'border-rose-500/30 text-rose-400',
    info: 'border-cyan-500/30 text-cyan-400',
  };

  return (
    <div className={`toast ${type} ${colors[type]}`}>
      <span className="text-sm">{message}</span>
    </div>
  );
}

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4000);
  }, []);

  useEffect(() => {
    (window as Window & { showToast?: typeof addToast }).showToast = addToast;
    return () => {
      delete (window as Window & { showToast?: typeof addToast }).showToast;
    };
  }, [addToast]);

  const mainContentStyle = {
    marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarCollapsed ? '80px' : '260px') : '0',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {!hasEntered && <WelcomeOverlay onEnter={() => setHasEntered(true)} />}

      {hasEntered && (
        <div className="flex min-h-screen page-enter">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="flex-1 min-h-screen transition-all duration-300" style={mainContentStyle}>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f]/80 px-6 backdrop-blur-xl">
              <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 lg:hidden">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden lg:block">
                <h2 className="text-lg font-semibold capitalize text-white">{currentPage}</h2>
              </div>

              <div className="flex items-center gap-4">
                <button className="relative rounded-lg p-2 text-zinc-400 hover:bg-white/10">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-500" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/20">
                    J
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white">Joel</p>
                    <p className="text-xs text-zinc-500">Owner</p>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 sm:p-6">
              <motion.div key={currentPage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <PageRouter currentPage={currentPage} />
              </motion.div>
            </div>
          </main>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  );
}
