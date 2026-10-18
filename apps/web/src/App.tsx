import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.js';
import { api } from './lib/api.js';
import { Profile } from './types/index.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { ProfileCard } from './components/ProfileCard.js';
import { ProfileForm } from './components/ProfileForm.js';
import { SyncStatusPanel } from './components/SyncStatusPanel.js';
import { AuditLogViewer } from './components/AuditLogViewer.js';
import { User, ArrowLeftRight, History, Shield, Smartphone } from 'lucide-react';

export const App: React.FC = () => {
  const { user, accessToken, loading } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(true); // Default enabled for automatic sync demonstration
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'sync' | 'audit'>('profile');

  // Fetch current user profile from Express backend API
  const loadProfile = useCallback(
    async (isBackground = false) => {
      if (!accessToken) return;

      if (!isBackground) {
        setIsRefreshing(true);
      }

      try {
        const res = await api.getMyProfile(accessToken);
        setProfile(res.data);
        setLastSyncTime(new Date());
      } catch (err: any) {
        console.error('Failed to sync profile from backend:', err);
      } finally {
        if (!isBackground) {
          setIsRefreshing(false);
        }
      }
    },
    [accessToken]
  );

  // Initial load when access token is available
  useEffect(() => {
    if (accessToken) {
      setIsLoadingProfile(true);
      loadProfile(false).finally(() => setIsLoadingProfile(false));
    }
  }, [accessToken, loadProfile]);

  // Periodic polling synchronization (every 5 seconds when enabled)
  useEffect(() => {
    if (!accessToken || !isPolling) return;

    const interval = setInterval(() => {
      loadProfile(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [accessToken, isPolling, loadProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono">Initializing Authentication Session...</span>
        </div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar
          isPolling={false}
          onTogglePolling={() => {}}
          onRefresh={() => {}}
          isRefreshing={false}
        />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20 sm:pb-10 safe-bottom">
      {/* Top Header */}
      <Navbar
        isPolling={isPolling}
        onTogglePolling={() => setIsPolling(!isPolling)}
        onRefresh={() => loadProfile(false)}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Edit</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sync'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Sync Cockpit</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ProfileCard profile={profile} isLoading={isLoadingProfile} />
            <ProfileForm
              profile={profile}
              onProfileUpdated={(updated) => {
                setProfile(updated);
                setLastSyncTime(new Date());
              }}
            />
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="max-w-3xl mx-auto">
            <SyncStatusPanel
              profile={profile}
              isPolling={isPolling}
              onTogglePolling={() => setIsPolling(!isPolling)}
              onRefresh={() => loadProfile(false)}
              isRefreshing={isRefreshing}
              lastSyncTime={lastSyncTime}
            />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="max-w-3xl mx-auto">
            <AuditLogViewer />
          </div>
        )}
      </main>

      {/* Mobile Bottom Quick-Action Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex justify-around items-center z-40 safe-bottom">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
            activeTab === 'profile' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
            activeTab === 'sync' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Sync</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${
            activeTab === 'audit' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit</span>
        </button>
      </nav>
    </div>
  );
};
