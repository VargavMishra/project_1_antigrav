import React, { useState } from 'react';
import { RefreshCw, Smartphone, Globe, CheckCircle2, Database, ShieldAlert, Cpu, ArrowLeftRight } from 'lucide-react';
import { Profile } from '../types/index.js';

interface SyncStatusPanelProps {
  profile: Profile | null;
  isPolling: boolean;
  onTogglePolling: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastSyncTime: Date | null;
}

export const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({
  profile,
  isPolling,
  onTogglePolling,
  onRefresh,
  isRefreshing,
  lastSyncTime,
}) => {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
            Live Cross-Client Synchronization Cockpit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrating two-way sync between Web Browser, Android APK WebView, and PostgreSQL
          </p>
        </div>

        {/* Polling Toggle Switch */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
          <span className="text-xs font-medium text-slate-300">Auto-Sync (5s)</span>
          <button
            type="button"
            onClick={onTogglePolling}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPolling ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                isPolling ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sync Topology Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-indigo-900/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Client 1: Website</h4>
            <p className="text-[11px] text-slate-400">Desktop / Mobile Web Browser</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-violet-900/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Client 2: Mobile APK</h4>
            <p className="text-[11px] text-slate-400">React Native Expo WebView</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-emerald-900/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Source of Truth</h4>
            <p className="text-[11px] text-slate-400">Supabase PostgreSQL + Triggers</p>
          </div>
        </div>
      </div>

      {/* Sync Telemetry */}
      <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span className="text-slate-300 font-medium">Status:</span>
          <span className="text-white font-semibold">
            {isRefreshing ? 'Fetching updates from API...' : isPolling ? 'Auto-polling active (5s)' : 'Manual sync ready'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono text-[11px]">
            Last Synced: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Senior Dev Demonstration Protocol Guide */}
      <div className="bg-gradient-to-br from-indigo-950/30 to-slate-950/70 p-4 rounded-xl border border-indigo-900/40 mb-6">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-indigo-400" />
          Senior Developer Live Demonstration Script
        </h4>
        <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Open this deployed website in your desktop browser.</li>
          <li>Open the installed Android APK on your mobile phone loading the same deployment URL.</li>
          <li>Edit a field in the form above (e.g. Bio or Hobbies) and click <strong>Save Profile Changes</strong>.</li>
          <li>Notice the <code>updated_at</code> timestamp auto-refreshed by the PostgreSQL trigger.</li>
          <li>Turn on <strong>Auto-Sync</strong> or click <strong>Sync</strong> inside the mobile app to verify instant cross-device synchronization.</li>
          <li>Edit a field directly on the mobile app, save it, and watch the desktop browser reflect the change.</li>
        </ol>
      </div>

      {/* Raw Payload Inspector Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-xs text-slate-400 hover:text-slate-200 underline font-mono cursor-pointer"
        >
          {showJson ? 'Hide raw database payload' : 'Inspect raw JSON database record'}
        </button>

        {showJson && (
          <pre className="mt-3 p-3 bg-black/60 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
            {JSON.stringify(profile, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
