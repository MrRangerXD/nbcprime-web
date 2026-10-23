import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="font-display text-7xl font-bold text-gradient">404</div>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That route does not exist on NBCPrime.</p>
      <Link to="/" className="btn-primary mt-8">
        <ArrowLeft size={16} /> Back home
      </Link>
    </div>
  );
}
