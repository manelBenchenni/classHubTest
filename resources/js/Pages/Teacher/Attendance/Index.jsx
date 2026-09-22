import TeacherLayout from '@/Layouts/TeacherLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const dayLabels = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

export default function Index({ date, todaysSchedules, selectedSchedule, students }) {
    const [pickedDate, setPickedDate] = useState(date);

    const changeDate = (value) => {
        setPickedDate(value);
        router.get(route('teacher.attendance.index'), { date: value }, { preserveState: true });
    };

    const selectSchedule = (scheduleId) => {
        router.get(
            route('teacher.attendance.index'),
            { date: pickedDate, schedule_id: scheduleId },
            { preserveState: true }
        );
    };

    return (
        <TeacherLayout>
            <Head title="Attendance" />

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
                        <p className="mt-1 text-sm text-slate-500">Mark presence for one of your sessions.</p>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
                        <input
                            type="date"
                            value={pickedDate}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => changeDate(e.target.value)}
                            className="rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Session picker for that weekday */}
                <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                        Sessions on {dayLabels[new Date(pickedDate + 'T00:00:00').getDay() === 0 ? 7 : new Date(pickedDate + 'T00:00:00').getDay()]}
                    </div>

                    {todaysSchedules.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                            No sessions scheduled for you on this date.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {todaysSchedules.map((s) => (
                                <li key={s.id}>
                                    <button
                                        onClick={() => selectSchedule(s.id)}
                                        className={
                                            'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ' +
                                            (selectedSchedule?.id === s.id ? 'bg-indigo-50' : 'hover:bg-slate-50')
                                        }
                                    >
                                        <div>
                                            <div className="font-medium text-slate-900">{s.subject}</div>
                                            <div className="text-slate-500">{s.room?.name}</div>
                                        </div>
                                        <div className="text-slate-700">
                                            {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Student list for the selected session */}
                {selectedSchedule && (
                    <AttendanceForm
                        key={`${selectedSchedule.id}-${pickedDate}`}
                        schedule={selectedSchedule}
                        date={pickedDate}
                        students={students}
                    />
                )}
            </div>
        </TeacherLayout>
    );
}
function AttendanceForm({ schedule, date, students }) {
    const { data, setData, post, processing, errors } = useForm({
        schedule_id: schedule.id,
        date,
        statuses: students.map((s) => ({
            student_id: s.id,
            status: s.status ?? 'absent', // default off = absent
        })),
    });

    const toggleStatus = (studentId) => {
        setData(
            'statuses',
            data.statuses.map((entry) =>
                entry.student_id === studentId
                    ? { ...entry, status: entry.status === 'present' ? 'absent' : 'present' }
                    : entry
            )
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('teacher.attendance.store'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {schedule.room?.name} — {students.length} student{students.length !== 1 ? 's' : ''}
            </div>

            {errors.date && <div className="px-4 pt-3 text-sm text-rose-600">{errors.date}</div>}

            {students.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">No students in this room yet.</div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {data.statuses.map((entry) => {
                        const student = students.find((s) => s.id === entry.student_id);
                        const isPresent = entry.status === 'present';
                        return (
                            <li key={entry.student_id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <span className="font-medium text-slate-900">{student?.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className={isPresent ? 'text-emerald-600 text-xs font-medium' : 'text-slate-400 text-xs font-medium'}>
                                        {isPresent ? 'Present' : 'Absent'}
                                    </span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isPresent}
                                        onClick={() => toggleStatus(entry.student_id)}
                                        className={
                                            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ' +
                                            (isPresent ? 'bg-emerald-600' : 'bg-slate-300')
                                        }
                                    >
                                        <span
                                            className={
                                                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
                                                (isPresent ? 'translate-x-6' : 'translate-x-1')
                                            }
                                        />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {students.length > 0 && (
                <div className="flex justify-end border-t border-slate-100 px-4 py-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {processing ? 'Saving…' : 'Save attendance'}
                    </button>
                </div>
            )}
        </form>
    );
}