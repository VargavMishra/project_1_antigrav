import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { RefreshCw, LogOut, ShieldCheck, Database, Smartphone } from 'lucide-react';

interface NavbarProps {
  isPolling: boolean;
  onTogglePolling: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isPolling, onTogglePolling, onRefresh, isRefreshing }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 safe-top">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              SyncedPlatform
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Web & Mobile Shared Architecture
            </p>
          </div>
        </div>

        {/* Sync & User Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Polling / Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Force Synchronize with Backend"
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* User info & Logout */}
          {user && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                  {user.email || 'Phone Verified'}
                </p>
              </div>

              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
