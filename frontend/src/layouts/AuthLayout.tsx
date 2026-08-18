import { Outlet } from 'react-router-dom';
import { BookOpenCheck, Clock3, ShieldCheck } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: BookOpenCheck,
    title: '10 MCQ questions',
    description: 'A short paper that is easy to run in class or in a lab demo.',
  },
  {
    icon: Clock3,
    title: 'Timed attempt',
    description: 'The countdown keeps the exam moving and gives the timer a visible role.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Students take the exam, while staff manage the question bank and results.',
  },
];

export const AuthLayout = () => (
  <div className="flex min-h-screen bg-slate-50">
    <aside className="hidden w-1/2 flex-col justify-between bg-slate-900 p-12 lg:flex">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold text-white">Exam System (MCQ)</span>
      </div>

      <div className="max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
          A simple online exam flow.
        </h2>
        <p className="mt-3 text-slate-400">
          Students log in, answer the paper, and see their score right away. Staff keep the
          question bank tidy from the same app.
        </p>

        <ul className="mt-10 space-y-6">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-400">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-500">React · Vite · Tailwind CSS · Express · Prisma · SQLite</p>
    </aside>

    <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  </div>
);
