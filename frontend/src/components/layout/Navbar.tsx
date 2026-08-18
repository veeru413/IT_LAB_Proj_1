import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CheckSquare, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const STUDENT_NAV: NavItem[] = [{ to: '/dashboard', label: 'Exam', icon: CheckSquare }];

const STAFF_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
];

const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const Navbar = () => {
  const { user, isStaff, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = isStaff ? STAFF_NAV : STUDENT_NAV;

  const handleLogout = async () => {
    await logout();
    notify('You have been logged out', 'info');
    navigate('/login', { replace: true });
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to={isStaff ? '/admin' : '/dashboard'} className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <CheckSquare className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="hidden text-base font-semibold tracking-tight text-slate-900 sm:block">
              Exam System (MCQ)
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClasses}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 md:flex">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
                aria-hidden="true"
              >
                {user ? initials(user.name) : '?'}
              </span>
              <div className="leading-tight">
                <p className="max-w-[10rem] truncate text-sm font-medium text-slate-900">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {isStaff ? 'Staff' : `Student${user?.studentId ? ` · ${user.studentId}` : ''}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 md:flex"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"
        >
          <div className="mb-3 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600"
              aria-hidden="true"
            >
              {user ? initials(user.name) : '?'}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">
                {isStaff ? 'Staff' : `Student${user?.studentId ? ` · ${user.studentId}` : ''}`}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMenuOpen(false)}
                className={linkClasses}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
