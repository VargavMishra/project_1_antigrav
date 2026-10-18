import React from 'react';
import { Profile } from '../types/index.js';
import { User, Calendar, Clock, Sparkles, Heart, Zap, Tag, ShieldCheck, Database } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile | null;
  isLoading: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isLoading }) => {
  if (isLoading && !profile) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 animate-pulse">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-800"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-800 rounded w-1/3"></div>
            <div className="h-3 bg-slate-800 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No profile record found. Try updating or refreshing.
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header: Avatar + Names */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-700 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-md border border-indigo-400/30">
                {profile.display_name ? profile.display_name[0]?.toUpperCase() : 'U'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white" title="Active">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {profile.display_name || 'Unnamed User'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 capitalize">
                {profile.gender}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
              <span className="text-slate-500">ID:</span>
              <span className="truncate max-w-[200px] sm:max-w-none">{profile.id}</span>
            </p>
          </div>
        </div>

        {/* Database trigger indicator pill */}
        <div className="self-start sm:self-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>PostgreSQL Trigger Synchronized</span>
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="py-5 border-b border-slate-800/80">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-400" />
          About Me
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed font-normal bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50">
          {profile.bio || 'No biography written yet.'}
        </p>
      </div>

      {/* Tags grid: Hobbies & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-5 border-b border-slate-800/80">
        {/* Hobbies */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            Hobbies & Interests
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.hobbies && profile.hobbies.length > 0 ? (
              profile.hobbies.map((hobby, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-900/40"
                >
                  {hobby}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No hobbies listed</span>
            )}
          </div>
        </div>

        {/* Strengths */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Core Strengths & Skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.strengths && profile.strengths.length > 0 ? (
              profile.strengths.map((str, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-900/40"
                >
                  {str}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No strengths listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps & Database Evidence */}
      <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Created:</span>
          <span className="font-mono text-slate-300">{formatTimestamp(profile.created_at)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">Last Modified (Triggered):</span>
          <span className="font-mono text-indigo-200 font-semibold">{formatTimestamp(profile.updated_at)}</span>
        </div>
      </div>
    </div>
  );
};
