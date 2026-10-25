import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="mono font-display text-7xl font-bold text-white/10">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        This page got nuked. Or it never existed.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary"><Home size={15} /> Home</Link>
        <button onClick={() => window.history.back()} className="btn-ghost">
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    </div>
  );
}