import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import type { PageId } from '../types';
import { getBookings, getInventory, getInvoices } from '../data/manager';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
  },
];

export function Sidebar({ currentPage, onNavigate, isCollapsed, onToggleCollapse, isOpen, onClose }: SidebarProps) {
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function fetchBadges() {
      try {
        const [inv, book, invc] = await Promise.all([
          getInventory().catch(() => []),
          getBookings().catch(() => []),
          getInvoices().catch(() => []),
        ]);
        if (cancelled) return;
        setBadges({
          inventory: inv.filter((item: any) => item.status === 'low-stock' || item.status === 'out-of-stock').length,
          bookings: book.filter((b: any) => b.status === 'pending').length,
          invoices: invc.filter((i: any) => i.status !== 'paid').length,
        });
      } catch (e) {
        if (!cancelled) console.warn('Sidebar badges unavailable', e);
      }
    }
    // Defer to next tick so it never blocks the splash → dashboard transition
    const timer = setTimeout(fetchBadges, 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border-r border-white/[0.06] transition-all duration-300 ease-out flex flex-col',
          isCollapsed ? 'w-[72px]' : 'w-[260px]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('h-16 flex items-center border-b border-white/[0.06]', isCollapsed ? 'justify-center px-2' : 'px-5 gap-3')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-white tracking-tight">TAP KLASS</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Enterprise</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const badgeCount = badges[item.id] || 0;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={cn(
                  'relative w-full flex items-center gap-3 rounded-xl transition-all duration-200 group',
                  isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                  currentPage === item.id ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] border border-transparent'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {badgeCount > 0 && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/10 text-zinc-400">{badgeCount}</span>}
                  </>
                )}
                {isCollapsed && badgeCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={onToggleCollapse} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-all duration-200">
            <svg className={cn('w-5 h-5 transition-transform duration-300', isCollapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}