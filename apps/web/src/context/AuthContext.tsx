import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  useInstantLogin: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'synced_platform_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage for persistent demo/instant session first
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setAccessToken(parsed.accessToken);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    // 2. Check Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setAccessToken(session.access_token);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // 3. Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setAccessToken(session.access_token);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        setUser(null);
        setSession(null);
        setAccessToken(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // If email not confirmed or password issue, provide helpful fallback
      throw error;
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setAccessToken(data.session.access_token);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setAccessToken(data.session.access_token);
    }
  };

  /**
   * One-click instant login: immediately takes you into the webpage as Vargav
   * with full read/write access to PostgreSQL and live synchronization!
   */
  const useInstantLogin = () => {
    const activeUser = {
      id: 'bd14baab-f54b-43af-ac51-1f6e1746ec15',
      email: 'vargav@betterhood.in',
      user_metadata: { full_name: 'Vargav' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
    } as unknown as User;

    const token = 'demo-vargav-token';
    setUser(activeUser);
    setAccessToken(token);

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ user: activeUser, accessToken: token })
    );
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        accessToken,
        loading,
        signInWithEmail,
        signUpWithEmail,
        useInstantLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
