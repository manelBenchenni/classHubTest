import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const inputCls =
    'w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

const dayLabels = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

export default function Index({ schedules, rooms, teachers }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);

    const destroy = (schedule) => {
        if (confirm(`Delete this ${schedule.subject} slot?`)) {
            router.delete(route('manager.schedules.destroy', schedule.id), { preserveScroll: true });
        }
    };

    // Group by day so the page reads like a weekly timetable
    const byDay = schedules.reduce((acc, s) => {
        (acc[s.day_of_week] ??= []).push(s);
        return acc;
    }, {});

    return (
        <ManagerLayout>
            <Head title="Schedules" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Schedules</h1>
                        <p className="mt-1 text-sm text-slate-500">Weekly time slots, by room and teacher.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Create slot
                    </button>
                </div>

                <div className="space-y-6">
                    {Object.keys(dayLabels).map((day) => {
                        const slots = (byDay[day] ?? []).sort((a, b) => a.start_time.localeCompare(b.start_time));
                        if (slots.length === 0) return null;

                        return (
                            <div key={day} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                                    {dayLabels[day]}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-left text-xs font-medium text-slate-500">
                                            <tr>
                                                <th className="px-4 py-2">Time</th>
                                                <th className="px-4 py-2">Subject</th>
                                                <th className="px-4 py-2">Teacher</th>
                                                <th className="px-4 py-2">Room</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {slots.map((s) => (
                                                <tr key={s.id} className="transition hover:bg-slate-50">
                                                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                                                        {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                                    </td>
                                                    <td className="px-4 py-2 font-medium text-slate-900">{s.subject}</td>
                                                    <td className="px-4 py-2 text-slate-700">{s.teacher?.name}</td>
                                                    <td className="px-4 py-2 text-slate-700">{s.room?.name}</td>
                                                    <td className="whitespace-nowrap px-4 py-2 text-right">
                                                        <button
                                                            onClick={() => setEditingSchedule(s)}
                                                            className="rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => destroy(s)}
                                                            className="rounded-md px-2 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}

                    {schedules.length === 0 && (
                        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                            <div className="text-sm font-medium text-slate-700">No schedule slots yet</div>
                            <div className="mt-1 text-sm text-slate-500">Create the first slot to get started.</div>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <ScheduleModal title="Create slot" rooms={rooms} teachers={teachers} onClose={() => setShowCreate(false)} />
            )}
            {editingSchedule && (
                <ScheduleModal
                    title="Edit slot"
                    schedule={editingSchedule}
                    rooms={rooms}
                    teachers={teachers}
                    onClose={() => setEditingSchedule(null)}
                />
            )}
        </ManagerLayout>
    );
}

/**
 * Handles both create and edit: pass `schedule` to edit an existing slot,
 * omit it to create a new one. Conflict errors (teacher_id / room_id) come
 * back from the controller's overlap check and render like any other
 * validation error.
 */
function ScheduleModal({ title, schedule, rooms, teachers, onClose }) {
    const isEditing = Boolean(schedule);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        room_id: schedule?.room?.id ? String(schedule.room.id) : '',
        teacher_id: schedule?.teacher?.id ? String(schedule.teacher.id) : '',
        subject: schedule?.subject ?? '',
        day_of_week: schedule?.day_of_week ? String(schedule.day_of_week) : '1',
        start_time: schedule?.start_time?.slice(0, 5) ?? '',
        end_time: schedule?.end_time?.slice(0, 5) ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (isEditing) {
            put(route('manager.schedules.update', schedule.id), options);
        } else {
            post(route('manager.schedules.store'), options);
        }
    };

    return (
        <Modal title={title} onClose={onClose}>
            <form onSubmit={submit}>
                <Field label="Subject" error={errors.subject}>
                    <input
                        type="text"
                        autoFocus
                        value={data.subject}
                        onChange={(e) => setData('subject', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Teacher" error={errors.teacher_id}>
                        <select
                            value={data.teacher_id}
                            onChange={(e) => setData('teacher_id', e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Select…</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Room" error={errors.room_id}>
                        <select
                            value={data.room_id}
                            onChange={(e) => setData('room_id', e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Select…</option>
                            {rooms.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </Field>
                </div>

                <Field label="Day" error={errors.day_of_week}>
                    <select
                        value={data.day_of_week}
                        onChange={(e) => setData('day_of_week', e.target.value)}
                        className={inputCls}
                    >
                        {Object.entries(dayLabels).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Start time" error={errors.start_time}>
                        <input
                            type="time"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="End time" error={errors.end_time}>
                        <input
                            type="time"
                            value={data.end_time}
                            onChange={(e) => setData('end_time', e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                </div>

                <ModalActions onClose={onClose} processing={processing} label={isEditing ? 'Save changes' : 'Create slot'} />
            </form>
        </Modal>
    );
}

function Modal({ title, children, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-5 text-lg font-semibold tracking-tight">{title}</h2>
                {children}
            </div>
        </div>
    );
}

function ModalActions({ onClose, processing, label }) {
    return (
        <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancel
            </button>
            <button
                type="submit"
                disabled={processing}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
                {processing ? 'Saving…' : label}
            </button>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
            {children}
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}