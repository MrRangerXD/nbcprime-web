import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui';

export default function Login() {
  const { user, login, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const error = params.get('error');

  useEffect(() => {
    if (user && !loading) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5">
      <div className="card w-full p-8 text-center">
        <img src="/logo.png" alt="NBCPrime" className="mx-auto h-16 w-16 rounded-2xl" />
        <h1 className="mt-6 font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to access your dashboard.</p>

        {error && (
          <div className="mt-4">
            <Badge tone="red">Login failed: {error.replace(/_/g, ' ')}</Badge>
          </div>
        )}

        <button onClick={login} className="btn-primary mt-8 w-full py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Sign in with Discord
        </button>

        <p className="mt-5 text-xs text-muted">We only read your username, avatar, email and server list.</p>
      </div>
    </div>
  );
}
