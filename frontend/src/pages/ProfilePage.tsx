import { CalendarDays, IdCard, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/date';

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-4">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  </div>
);

/** Read-only account summary for both roles. */
export const ProfilePage = () => {
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Your account details." />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700">
              {user.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('')}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <div className="mt-1">
                <Badge
                  tone={isAdmin ? 'brand' : 'info'}
                  icon={<ShieldCheck className="h-3 w-3" aria-hidden="true" />}
                >
                  {isAdmin ? 'Administrator' : 'Student'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <dl className="divide-y divide-slate-100">
            <InfoRow icon={UserIcon} label="Full name" value={user.name} />
            <InfoRow icon={Mail} label="Email address" value={user.email} />
            <InfoRow
              icon={IdCard}
              label="Student ID"
              value={user.studentId ?? 'Not applicable for administrator accounts'}
            />
            <InfoRow
              icon={ShieldCheck}
              label="Role"
              value={isAdmin ? 'ADMIN - full access to all students and assignments' : 'STUDENT - access to your own tasks only'}
            />
            <InfoRow icon={CalendarDays} label="Member since" value={formatDate(user.createdAt)} />
          </dl>
        </CardBody>
      </Card>

      <p className="mt-4 px-1 text-xs text-slate-500">
        Your password is stored only as a bcrypt hash and is never displayed or transmitted back to
        the browser.
      </p>
    </div>
  );
};
