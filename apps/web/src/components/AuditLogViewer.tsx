import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { AuditLogEntry } from '../types/index.js';
import { ShieldCheck, History, RefreshCw, Database } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs(accessToken);
      setLogs(res.data || []);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [accessToken]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            PostgreSQL Database Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrates real database triggers capturing row-level mutation events
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg text-xs flex items-center gap-1 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span className="text-[11px] font-medium hidden sm:inline">Refresh Logs</span>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="p-6 bg-slate-950/40 rounded-xl border border-slate-800/60 text-center text-xs text-slate-500">
          No audit entries recorded yet. Modify the profile above to trigger audit logging.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {log.action}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(log.performed_at).toLocaleTimeString()} ({new Date(log.performed_at).toLocaleDateString()})
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {log.action === 'UPDATE' && log.new_data && (
                  <p className="truncate text-slate-400">
                    Modified: <span className="text-slate-200">{log.new_data.display_name}</span> • Gender:{' '}
                    <span className="text-slate-200">{log.new_data.gender}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
