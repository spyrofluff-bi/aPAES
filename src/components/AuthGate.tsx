'use client';

import React, { useState, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, LogIn, LogOut, Loader2 } from 'lucide-react';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ authenticated: boolean; username?: string; is_admin?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const palettes = [
      { page: '#e8edf7', darkPage: '#111827', nav: '#243b66', accent: '#4f6fb5', accentDark: '#89a7e8', success: '#277a62' },
      { page: '#f1e8df', darkPage: '#211815', nav: '#6b3f32', accent: '#b26042', accentDark: '#e7a07e', success: '#38745b' },
      { page: '#e7f0eb', darkPage: '#101d1a', nav: '#24594d', accent: '#3f8b76', accentDark: '#80c8ad', success: '#2f7659' },
      { page: '#eee8f5', darkPage: '#1a1425', nav: '#513d75', accent: '#8062b2', accentDark: '#bba2e2', success: '#397a6a' },
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const root = document.documentElement;
    root.style.setProperty('--palette-page', palette.page);
    root.style.setProperty('--palette-dark-page', palette.darkPage);
    root.style.setProperty('--palette-nav', palette.nav);
    root.style.setProperty('--palette-accent', palette.accent);
    root.style.setProperty('--palette-accent-dark', palette.accentDark);
    root.style.setProperty('--palette-success', palette.success);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error('Session check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const resOptions = await fetch('/api/auth/login/options', { method: 'POST' });
      const options = await resOptions.json();
      if (options.error) throw new Error(options.error);

      const asseResp = await startAuthentication({ optionsJSON: options });

      const resVerify = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asseResp),
      });

      const verifyData = await resVerify.json();
      if (verifyData.error) throw new Error(verifyData.error);

      await checkSession();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setUser({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--palette-page)]">
        <Loader2 className="w-12 h-12 text-[#6c40d6] animate-spin" />
      </div>
    );
  }

  if (user && !user.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--palette-page)] p-5 font-sans">
        <div className="max-w-md w-full bg-white border-[4px] border-black rounded-3xl p-8 shadow-[8px_8px_0_#000]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[var(--palette-accent)] border-[3px] border-black flex items-center justify-center text-white mb-5 shadow-[4px_4px_0_#000]">
              <Fingerprint size={38} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-center leading-none">
              Iniciar sesión
            </h1>
          </div>

          {authError && (
            <div className="bg-rose-50 border-[3px] border-rose-500 p-4 mb-6 text-rose-600 font-bold text-sm">
              Error: {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#298d5c] text-white py-4 border-[4px] border-black font-black text-xl flex items-center justify-center gap-2 shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn /> Entrar</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-[999] flex items-center gap-3">
        {user?.is_admin && (
           <span className="bg-[#351b69] text-white text-[10px] font-black px-2 py-1 rounded border-2 border-black uppercase shadow-[2px_2px_0_#000]">
             Admin
           </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-white/80 backdrop-blur-sm border-2 border-black px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-2 shadow-[2px_2px_0_#000] hover:bg-rose-50 hover:border-rose-500 hover:text-rose-500 transition-all"
        >
          <LogOut size={14} /> {user?.username}
        </button>
      </div>
      {children}
    </>
  );
}
