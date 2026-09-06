import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Globe,
  Infinity as InfinityIcon,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignUpViewProps {
  onSwitchToSignIn: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  onSwitchToSignIn,
  onSuccess,
  onClose,
}) => {
  const { signInWithGoogle, signUpWithEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your email address and a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim() || undefined);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      let msg = 'Registration failed. Please check your information.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters with letters and numbers.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-up was closed.');
      } else {
        setError(err.message || 'Google registration failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* View Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2.5">
          <Sparkles className="w-3.5 h-3.5" /> 100% Free Forever
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Create Free Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Unlock custom domains, permanent links, and device telemetry.
        </p>
      </div>

      {/* Value Perks Mini Grid */}
      <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
        <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
          <div className="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Globe className="w-3 h-3" />
          </div>
          <span>Custom Domains</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <InfinityIcon className="w-3 h-3" />
          </div>
          <span>Permanent Links</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
          <div className="w-5 h-5 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <BarChart3 className="w-3 h-3" />
          </div>
          <span>Device Telemetry</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-3 h-3" />
          </div>
          <span>Passcode &amp; UTM</span>
        </div>
      </div>

      {/* Google 1-Click Registration */}
      <button
        type="button"
        id="signup-google-button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>Sign Up with Google</span>
      </button>

      {/* Or Divider */}
      <div className="relative flex items-center justify-center my-3.5">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          or register with email
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Sign Up Form */}
      <form onSubmit={handleSignUp} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Full Name <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Jenkins"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@company.com"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-200 focus:outline-none"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength meter */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Password Strength:</span>
                <span
                  className={`font-semibold ${
                    strength.label === 'Strong'
                      ? 'text-emerald-400'
                      : strength.label === 'Good'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {strength.label}
                </span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    strength.score >= 1 ? strength.color : 'bg-transparent'
                  }`}
                />
                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    strength.score >= 2 ? strength.color : 'bg-transparent'
                  }`}
                />
                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    strength.score >= 3 ? strength.color : 'bg-transparent'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="signup-confirm-password"
              className="block text-xs font-semibold text-slate-300"
            >
              Confirm Password
            </label>
            {confirmPassword && (
              <span
                className={`text-[11px] font-semibold flex items-center gap-1 ${
                  passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </>
                ) : (
                  'Does not match'
                )}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              id="signup-confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                confirmPassword && !passwordsMatch
                  ? 'border-rose-500/50 focus:ring-rose-500/50'
                  : 'border-white/10 focus:ring-indigo-500/50'
              }`}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="signup-submit-button"
          disabled={loading || googleLoading || !passwordsMatch}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-5 pt-3.5 border-t border-white/10 text-center">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors ml-1"
          >
            Sign in &rarr;
          </button>
        </p>
      </div>
    </div>
  );
};
