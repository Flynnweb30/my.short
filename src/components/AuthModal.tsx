import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AuthMode } from '../types';
import { SignInView } from './Auth/SignInView';
import { SignUpView } from './Auth/SignUpView';

interface AuthModalProps {
  initialMode: AuthMode;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 shadow-2xl border border-white/10 my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          id="auth-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Smooth Top Switcher Pill */}
        <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1 mb-6 max-w-xs mx-auto">
          <button
            type="button"
            id="modal-toggle-signin"
            onClick={() => setMode('signin')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="modal-toggle-signup"
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Dynamic View with Seamless Switch */}
        <div className="transition-all duration-300">
          {mode === 'signin' ? (
            <SignInView
              onSwitchToSignUp={() => setMode('signup')}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          ) : (
            <SignUpView
              onSwitchToSignIn={() => setMode('signin')}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};