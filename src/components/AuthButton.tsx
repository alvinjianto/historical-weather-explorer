'use client';

import React from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AuthButton: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div className="w-32 h-8 bg-zinc-100 rounded-xl animate-pulse" />;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.user_metadata?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.full_name || 'User avatar'}
            className="w-8 h-8 rounded-full ring-2 ring-zinc-200"
          />
        )}
        <span className="text-xs font-semibold text-zinc-500 hidden sm:block truncate max-w-[10rem]">
          {user.user_metadata?.full_name || user.email}
        </span>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
    >
      <LogIn className="w-4 h-4" />
      Sign in with Google
    </button>
  );
};

export default AuthButton;
