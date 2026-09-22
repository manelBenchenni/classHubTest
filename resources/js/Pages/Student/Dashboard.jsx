import StudentLayout from '@/Layouts/StudentLayout';
import { Head } from '@inertiajs/react';

const dayLabels = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

export default function Dashboard({ room, schedules }) {
    const byDay = schedules.reduce((acc, s) => {
        (acc[s.day_of_week] ??= []).push(s);
        return acc;
    }, {});

    return (
        <StudentLayout>
            <Head title="Student Dashboard" />

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {room ? room.name : 'My schedule'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {room ? 'Your room and weekly schedule.' : "You haven't been assigned to a room yet."}
                    </p>
                </div>

                {!room && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Once a manager assigns you to a room, your weekly schedule will appear here.
                    </div>
                )}

                {room && (
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
                                                    <div className="text-slate-500">{s.teacher?.name}</div>
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
                                <div className="text-sm font-medium text-slate-700">No sessions scheduled yet</div>
                                <div className="mt-1 text-sm text-slate-500">Your room's weekly schedule will appear here.</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}