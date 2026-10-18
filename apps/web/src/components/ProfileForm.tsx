import React, { useState, useEffect } from 'react';
import { Profile, ProfileUpdateInput } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { Save, CheckCircle2, AlertCircle, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';

interface ProfileFormProps {
  profile: Profile | null;
  onProfileUpdated: (updated: Profile) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onProfileUpdated }) => {
  const { accessToken } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary' | 'other' | 'unspecified'>(
    (profile?.gender as any) || 'unspecified'
  );
  const [hobbiesStr, setHobbiesStr] = useState(profile?.hobbies?.join(', ') || '');
  const [strengthsStr, setStrengthsStr] = useState(profile?.strengths?.join(', ') || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if external profile prop updates (e.g. from mobile app save or sync poll!)
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setGender((profile.gender as any) || 'unspecified');
      setHobbiesStr(profile.hobbies?.join(', ') || '');
      setStrengthsStr(profile.strengths?.join(', ') || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        avatar_url: avatarUrl.trim(),
      };

      const res = await api.updateMyProfile(accessToken, payload);
      onProfileUpdated(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Edit Profile
          </h2>
          <p className="text-xs text-slate-400">
            Changes save directly to PostgreSQL and synchronize to your mobile app
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-5 p-3.5 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile changes persisted to database and synced successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/70 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Display Name & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Developer"
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs cursor-pointer"
            >
              <option value="unspecified">Unspecified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-Binary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Biography
            </label>
            <span className={`text-[10px] ${bio.length > 450 ? 'text-amber-400' : 'text-slate-500'}`}>
              {bio.length} / 500
            </span>
          </div>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="Tell us about yourself, your projects, and experience..."
            className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs leading-relaxed resize-none"
          />
        </div>

        {/* Hobbies (comma-separated) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Hobbies & Interests (comma-separated)
          </label>
          <input
            type="text"
            value={hobbiesStr}
            onChange={(e) => setHobbiesStr(e.target.value)}
            placeholder="Coding, Rock Climbing, Sci-Fi, Coffee"
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        {/* Strengths (comma-separated) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Core Strengths & Skills (comma-separated)
          </label>
          <input
            type="text"
            value={strengthsStr}
            onChange={(e) => setStrengthsStr(e.target.value)}
            placeholder="Distributed Systems, TypeScript, Supabase, Problem Solving"
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        {/* Avatar URL & Quick Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Avatar Image URL
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Quick presets:</span>
            <div className="flex items-center gap-1.5">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition-all"
                >
                  <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Persisting to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
