import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';

/** Shell for every authenticated page: navigation, content area, footer. */
export const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-slate-50">
    <Navbar />

    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Outlet />
    </main>

    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-slate-500">
          Student Task &amp; Assignment Manager · React · Express · Prisma · SQLite
        </p>
      </div>
    </footer>
  </div>
);
