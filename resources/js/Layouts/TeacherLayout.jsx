import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function TeacherLayout({ children }) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);

    const links = [
        { label: 'Dashboard', href: route('teacher.dashboard'), active: route().current('teacher.dashboard') },
        // { label: 'My schedule', href: route('teacher.schedule.index'), active: route().current('teacher.schedule.*') },
        { label: 'Attendance', href: route('teacher.attendance.index'), active: route().current('teacher.attendance.*') },
        // { label: 'Notifications', href: route('teacher.notifications.index'), active: route().current('teacher.notifications.*') },
    ];

    const initials = auth.user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href={route('teacher.dashboard')} className="flex items-center gap-2 font-semibold text-slate-900">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">T</span>
                            <span className="hidden sm:inline">Teacher</span>
                        </Link>

                        <div className="hidden items-center gap-1 sm:flex">
                            {links.map((l) => (
                                <Link
                                    key={l.label}
                                    href={l.href}
                                    className={
                                        'rounded-lg px-3 py-2 text-sm font-medium transition ' +
                                        (l.active
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                                    }
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden items-center gap-3 sm:flex">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                {initials}
                            </span>
                            <span className="text-sm text-slate-700">{auth.user.name}</span>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                            Log out
                        </Link>
                    </div>

                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden"
                        aria-label="Toggle menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                        </svg>
                    </button>
                </div>

                {open && (
                    <div className="border-t border-slate-200 bg-white px-4 pb-3 pt-2 sm:hidden">
                        {links.map((l) => (
                            <Link
                                key={l.label}
                                href={l.href}
                                className={
                                    'block rounded-lg px-3 py-2 text-sm font-medium ' +
                                    (l.active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600')
                                }
                            >
                                {l.label}
                            </Link>
                        ))}
                        <div className="mt-2 border-t border-slate-100 pt-2">
                            <div className="px-3 py-1 text-sm text-slate-500">{auth.user.name}</div>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
                            >
                                Log out
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            <main className="py-8">{children}</main>
        </div>
    );
}