import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui';
import Logo from '../components/Logo';

const ERRORS = {
  no_code: 'Discord did not return a code. Try again.',
  bad_state: 'Session expired. Try again.',
  oauth_failed: 'Discord rejected the login. Try again.',
  token: 'Token exchange failed. Try again.',
};

export default function Login() {
  const { user, loading, login } = useAuth();
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const navigate = useNavigate();
  const location = useLocation();
  const error = params.get('error');

  useEffect(() => {
    if (!loading && user) navigate(location.state?.from || '/dashboard', { replace: true });
  }, [user, loading, navigate, location.state]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-5">
      <Card className="w-full p-8 text-center">
        <div className="flex justify-center"><Logo withText={false} size={40} to={null} /></div>

        <h1 className="mt-5 font-display text-2xl font-bold">Sign in to NBCPrime</h1>
        <p className="mt-2 text-sm text-muted">
          Connect your Discord account to manage servers, run nukes remotely and unlock the dashboard.
        </p>

        {error && (
          <div className="mt-5 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-left">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-300" />
            <p className="text-xs text-red-200">{ERRORS[error] || 'Login failed. Try again.'}</p>
          </div>
        )}

        <button onClick={login} disabled={loading} className="btn-primary mt-6 w-full py-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          Sign in with Discord
        </button>

        <p className="mt-4 text-[11px] leading-relaxed text-dim">
          We only read your id, username, avatar and the list of servers where you are admin.
        </p>
      </Card>
    </div>
  );
}