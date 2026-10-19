import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.js';
import { api } from './lib/api.js';
import { Profile, ProfileUpdateInput } from './types/index.js';
import { AuthModal } from './components/AuthModal.js';
import {
  Zap,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Smartphone,
  Save,
  Clock,
  User,
  Heart,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, accessToken, loading, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary' | 'other' | 'unspecified'>('unspecified');
  const [hobbiesStr, setHobbiesStr] = useState('');
  const [strengthsStr, setStrengthsStr] = useState('');

  // 1. Fetch profile from Express Backend & PostgreSQL
  const loadProfile = useCallback(
    async (isBackground = false) => {
      if (!accessToken) return;
      if (!isBackground) setIsLoading(true);

      try {
        const res = await api.getMyProfile(accessToken);
        if (res.data) {
          setProfile(res.data);
          setLastSyncTime(new Date());

          // Update form fields only if not currently saving
          if (!isSaving && !isBackground) {
            setDisplayName(res.data.display_name || '');
            setBio(res.data.bio || '');
            setGender((res.data.gender as any) || 'unspecified');
            setHobbiesStr(res.data.hobbies?.join(', ') || '');
            setStrengthsStr(res.data.strengths?.join(', ') || '');
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile from backend:', err);
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    },
    [accessToken, isSaving]
  );

  // Initial load
  useEffect(() => {
    if (accessToken) {
      loadProfile(false);
    }
  }, [accessToken, loadProfile]);

  // 2. Auto-polling synchronization (every 3 seconds)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      loadProfile(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [accessToken, loadProfile]);

  // 3. Handle saving changes to PostgreSQL
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const payload: ProfileUpdateInput = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        gender,
        hobbies: hobbiesStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        strengths: strengthsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await api.updateMyProfile(accessToken, payload);
      setProfile(res.data);
      setLastSyncTime(new Date());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update database.');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Loading indicator while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono">Loading Synced Platform...</span>
        </div>
      </div>
    );
  }

  // 5. If not logged in -> Show clean Login Screen
  if (!user || !accessToken) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AuthModal />
      </div>
    );
  }

  const formatTimestamp = (iso?: string) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return iso;
    }
  };

  // 6. Logged in -> The Static-Style Webpage with Live PostgreSQL Sync
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col safe-bottom">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30">
              ⚡
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                SyncedPlatform Webpage
              </h1>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Supabase PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-200">{user.user_metadata?.full_name || 'Vargav'}</p>
              <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
            </div>

            <button
              onClick={() => loadProfile(false)}
              disabled={isLoading}
              title="Force Refresh Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline font-medium">Sync Now</span>
            </button>

            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Webpage Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-700/80 rounded-2xl text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Successfully saved changes to PostgreSQL database!</p>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                The database trigger fired and auto-updated the timestamp. Your mobile app will reflect this live.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-rose-200 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Two-Column Grid: Saved Data (Left) & Edit Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: Current Saved Data in PostgreSQL */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Live Data in Database
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct state retrieved from PostgreSQL <code className="text-slate-300">profiles</code> table
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                Active Record
              </span>
            </div>

            {/* Display Name & Gender */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {profile?.display_name || displayName || 'Vargav'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 capitalize">
                  {profile?.gender || gender}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">ID: {profile?.id || user.id}</p>
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Biography
              </h4>
              <p className="text-sm text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                {profile?.bio || bio || 'No biography written yet.'}
              </p>
            </div>

            {/* Hobbies */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Hobbies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.hobbies && profile.hobbies.length > 0 ? profile.hobbies : hobbiesStr.split(',')).map(
                  (h, i) =>
                    h.trim() ? (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/50 text-rose-300 border border-rose-900/40"
                      >
                        {h.trim()}
                      </span>
                    ) : null
                )}
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Strengths
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.strengths && profile.strengths.length > 0 ? profile.strengths : strengthsStr.split(',')).map(
                  (s, i) =>
                    s.trim() ? (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-950/50 text-amber-300 border border-amber-900/40"
                      >
                        {s.trim()}
                      </span>
                    ) : null
                )}
              </div>
            </div>

            {/* Database Trigger Timestamp */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL Trigger Timestamp:</span>
              </div>
              <span className="font-mono text-emerald-300 font-bold">
                {formatTimestamp(profile?.updated_at)}
              </span>
            </div>
          </section>

          {/* RIGHT: Edit Data Form (Saves to PostgreSQL) */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
            <div className="pb-4 mb-5 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Save className="w-4 h-4 text-indigo-400" />
                Make Changes to Data
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Edits made here save directly to PostgreSQL and broadcast live to your mobile app
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Vargav"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Biography</label>
                  <span className="text-[10px] text-slate-500">{bio.length} / 500</span>
                </div>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  placeholder="Write your bio or test message here..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hobbies (comma-separated)
                </label>
                <input
                  type="text"
                  value={hobbiesStr}
                  onChange={(e) => setHobbiesStr(e.target.value)}
                  placeholder="Coding, Rock Climbing, Sci-Fi"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Strengths (comma-separated)
                </label>
                <input
                  type="text"
                  value={strengthsStr}
                  onChange={(e) => setStrengthsStr(e.target.value)}
                  placeholder="Architecture, Problem Solving, TypeScript"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Committing to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes to Database</span>
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Live Synchronization Telemetry Card */}
        <section className="bg-slate-950/80 border border-indigo-900/40 rounded-2xl p-5 text-xs text-slate-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-white">Live Bi-Directional Synchronization Active</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Last Synced: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Connecting...'}
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            📱 <strong>How to test live synchronization with mobile right now:</strong>
            <br />
            1. Open this exact webpage on your phone by visiting{' '}
            <code className="text-indigo-300 font-bold bg-slate-900 px-2 py-0.5 rounded">
              http://10.34.240.163:5173
            </code>{' '}
            or in the Expo mobile app.
            <br />
            2. Change the <strong>Display Name</strong> or <strong>Bio</strong> in the form above and click{' '}
            <strong>Save Changes to Database</strong>.
            <br />
            3. Watch the database commit the row, fire the trigger, and reflect immediately on your phone!
          </p>
        </section>
      </main>
    </div>
  );
};
