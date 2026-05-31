import { FormEvent, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/layout/Logo';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', color: 'bg-transparent' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 2) return { score, label: 'Weak 🔴', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium 🟡', color: 'bg-yellow-500' };
  return { score, label: 'Strong 🟢', color: 'bg-emerald-500' };
};

// Import assets
import imgDashboard from '@/assets/dashboard.png';
import imgBooking from '@/assets/booking.png';
import imgBilling from '@/assets/billing.png';
import imgReports from '@/assets/reports.png';

const SHOWCASE_ITEMS = [
  { id: 'dashboard', title: 'Real-time Dashboard', img: imgDashboard, desc: 'Monitor your gaming cafe\'s performance, active stations, and revenue at a glance.' },
  { id: 'booking', title: 'Seamless Bookings', img: imgBooking, desc: 'Manage reservations, avoid double bookings, and visualize your daily schedule.' },
  { id: 'billing', title: 'Lightning Fast Billing', img: imgBilling, desc: 'Process payments, add inventory items, and apply loyalty points in seconds.' },
  { id: 'reports', title: 'Advanced Analytics', img: imgReports, desc: 'Export detailed reports and track your long-term business growth.' },
];

interface AuthPageProps {
  initialIsSignUp?: boolean;
  isRecovery?: boolean;
  onBack?: () => void;
  onRecoveryComplete?: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export default function AuthPage({ initialIsSignUp = false, isRecovery = false, onBack, onRecoveryComplete, onShowTerms, onShowPrivacy }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Update page title based on mode
  useEffect(() => {
    document.title = isRecovery
      ? 'Set New Password · CoreControl'
      : isForgotPassword
      ? 'Reset Password · CoreControl'
      : isSignUp
      ? 'Create Account · CoreControl'
      : 'Sign In · CoreControl';
  }, [isSignUp, isForgotPassword, isRecovery]);

  // Auto-rotate showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % SHOWCASE_ITEMS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (isRecovery) {
        // Password recovery mode — update the password
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage('Password updated successfully! Redirecting to sign in...');
        // Sign out after updating password and redirect
        setTimeout(async () => {
          await supabase.auth.signOut();
          onRecoveryComplete?.();
        }, 2000);
      } else if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
        });
        if (resetError) throw resetError;
        setMessage('Password reset link sent! Please check your email.');
      } else if (isSignUp) {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Please check your email for a confirmation link.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        setMessage('Signed in.');
      }
    } catch (err: any) {
      let errorMsg = err?.message ?? 'Authentication failed.';
      
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        errorMsg = 'Supabase environment variables are missing.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left side: Premium Showcase */}
      <div className="relative hidden w-full lg:flex lg:w-3/5 overflow-hidden bg-muted/20 items-center justify-center border-r border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-12">
          {/* Image Container with Glow */}
          <div className="relative w-full aspect-[16/10] mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-50 mix-blend-screen transition-all duration-1000" />
            
            {SHOWCASE_ITEMS.map((item, idx) => (
              <div 
                key={item.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  idx === activeIndex 
                    ? 'opacity-100 translate-y-0 scale-100 z-10' 
                    : 'opacity-0 translate-y-8 scale-95 z-0'
                }`}
              >
                <img 
                  src={item.img} 
                  alt={item.title}
                  className="w-full h-full object-contain rounded-2xl border border-border/50 shadow-2xl bg-background/50"
                />
              </div>
            ))}
          </div>

          {/* Text Content */}
          <div className="text-center h-24">
            {SHOWCASE_ITEMS.map((item, idx) => (
              <div 
                key={item.id}
                className={`transition-all duration-700 absolute left-0 right-0 px-12 ${
                  idx === activeIndex 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">{item.title}</h2>
                <p className="text-muted-foreground text-lg">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-3 mt-8">
            {SHOWCASE_ITEMS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === activeIndex ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-2/5 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          
          <h1 className="text-3xl font-black tracking-tight">
            {isRecovery ? 'Set New Password' : isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRecovery
              ? 'Choose a strong new password for your CoreControl account.'
              : isForgotPassword 
              ? 'Enter your email address to receive a password reset link.' 
              : isSignUp 
              ? 'Register your cafe to start managing.' 
              : 'Sign in to access your CoreControl dashboard.'}
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            {/* Email field — hidden during recovery mode */}
            {!isRecovery && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <Input
                  type="email"
                  placeholder="admin@cafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                />
              </div>
            )}

            {/* Recovery mode: New + Confirm Password fields */}
            {isRecovery && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</label>
                  <Input
                    type="password"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                  />
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-2xs">
                        <span className="text-muted-foreground text-xs">Strength:</span>
                        <span className="font-semibold text-xs">
                          {getPasswordStrength(password).label}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-300", getPasswordStrength(password).color)}
                          style={{ width: `${(getPasswordStrength(password).score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                  />
                </div>
              </>
            )}
            
            {/* Standard login/signup password field */}
            {!isForgotPassword && !isRecovery && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMessage(null);
                        setIsForgotPassword(true);
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  className="h-11 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                />
                {isSignUp && password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-muted-foreground text-xs">Strength:</span>
                      <span className="font-semibold text-xs">
                        {getPasswordStrength(password).label}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-300", getPasswordStrength(password).color)}
                        style={{ width: `${(getPasswordStrength(password).score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-4 w-4 rounded border border-border/70 bg-muted/50 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                    {agreedToTerms && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{' '}
                  <button type="button" onClick={onShowTerms} className="text-primary hover:underline font-medium">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" onClick={onShowPrivacy} className="text-primary hover:underline font-medium">Privacy Policy</button>
                </span>
              </label>
            )}

            <Button type="submit" className="w-full h-11 text-base font-bold mt-2" disabled={loading || (isSignUp && !isForgotPassword && !isRecovery && !agreedToTerms)}>
              {loading ? 'Please wait...' : isRecovery ? 'Update Password' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign in'}
            </Button>
          </form>

          {error ? <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">{error}</div> : null}
          {message ? <div className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-500 border border-emerald-500/20">{message}</div> : null}
          
          {!isRecovery && (
            <div className="mt-8 text-center border-t border-border/50 pt-6">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    setIsForgotPassword(false);
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    setIsSignUp(!isSignUp);
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in instead' : "Don't have an account? Register your cafe"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
