import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export const NotFoundPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const homePath = !isAuthenticated ? '/login' : isAdmin ? '/admin' : '/dashboard';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileQuestion className="h-7 w-7" aria-hidden="true" />
      </span>

      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link to={homePath} className="mt-6">
        <Button>Go back home</Button>
      </Link>
    </div>
  );
};
