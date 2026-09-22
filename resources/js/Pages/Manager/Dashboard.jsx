import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    const pending = stats?.pendingUsers ?? 0;

    return (
        <ManagerLayout>
            <Head title="Manager Dashboard" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">A quick look at what's happening.</p>
                </div>

                {pending > 0 && (
                    <Link
                        href={route('manager.users.index', { status: 'pending' })}
                        className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition hover:bg-amber-100"
                    >
                        <span>
                            <strong className="font-semibold">{pending}</strong>{' '}
                            {pending === 1 ? 'registration is' : 'registrations are'} waiting for your review.
                        </span>
                        <span className="font-medium">Review now</span>
                    </Link>
                )}

                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatCard label="Total users" value={stats?.totalUsers} />
                    <StatCard label="Pending registrations" value={stats?.pendingUsers} tone={pending > 0 ? 'amber' : undefined} />
                    <StatCard label="Rooms" value={stats?.totalRooms} />
                    <StatCard label="Schedules" value={stats?.totalSchedules} />
                </div>

                <div className="flex flex-wrap gap-3">
    <Link
        href={route('manager.users.index')}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
    >
        Manage users
    </Link>
    <Link
        href={route('manager.rooms.index')}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50"
    >
        Manage rooms
    </Link>

    <Link
    href={route('manager.schedules.index')}
    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50"
>
    Manage schedules
</Link>
</div>
            </div>
        </ManagerLayout>
    );
}

function StatCard({ label, value, tone }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className={'h-2 w-2 rounded-full ' + (tone === 'amber' ? 'bg-amber-400' : 'bg-indigo-400')} />
                {label}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{value ?? '—'}</div>
        </div>
    );
}