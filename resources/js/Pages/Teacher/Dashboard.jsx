import TeacherLayout from '@/Layouts/TeacherLayout';
import { Head, Link } from '@inertiajs/react';

const dayLabels = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

export default function Dashboard({ schedules }) {
    const byDay = schedules.reduce((acc, s) => {
        (acc[s.day_of_week] ??= []).push(s);
        return acc;
    }, {});

    const todayIso = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const todaysSlots = (byDay[todayIso] ?? []).sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
        <TeacherLayout>
            <Head title="Teacher Dashboard" />

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">My schedule</h1>
                        <p className="mt-1 text-sm text-slate-500">Your sessions for the week.</p>
                    </div>
                    <Link
                        href={route('teacher.attendance.index')}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
                    >
                        Take attendance
                    </Link>
                </div>

                {todaysSlots.length > 0 && (
                    <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                        <div className="border-b border-slate-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                            Today — {dayLabels[todayIso]}
                        </div>
                        <ul className="divide-y divide-slate-100">
                            {todaysSlots.map((s) => (
                                <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                    <div>
                                        <div className="font-medium text-slate-900">{s.subject}</div>
                                        <div className="text-slate-500">
                                            {s.room?.name} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                        </div>
                                    </div>
                                    <Link
                                        href={route('teacher.attendance.index', { schedule_id: s.id })}
                                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                    >
                                        Mark presence
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-6">
                    {Object.keys(dayLabels).map((day) => {
                        const slots = (byDay[day] ?? []).sort((a, b) => a.start_time.localeCompare(b.start_time));
                        if (slots.length === 0) return null;

                        return (
                            <div key={day} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                                    {dayLabels[day]}
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {slots.map((s) => (
                                        <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                            <div>
                                                <div className="font-medium text-slate-900">{s.subject}</div>
                                                <div className="text-slate-500">{s.room?.name}</div>
                                            </div>
                                            <div className="text-slate-700">
                                                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}

                    {schedules.length === 0 && (
                        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                            <div className="text-sm font-medium text-slate-700">No sessions scheduled</div>
                            <div className="mt-1 text-sm text-slate-500">Your weekly schedule will appear here once assigned.</div>
                        </div>
                    )}
                </div>
            </div>
        </TeacherLayout>
    );
}