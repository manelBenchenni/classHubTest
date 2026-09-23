import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const inputCls =
    'w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Index({ rooms }) {
    const { auth } = usePage().props;
    const [showCreate, setShowCreate] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [assigningRoom, setAssigningRoom] = useState(null);

    const destroy = (room) => {
        if (confirm(`Delete ${room.name}? This can't be undone.`)) {
            router.delete(route('manager.rooms.destroy', room.id), {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.room) alert(errors.room);
                },
            });
        }
    };

    return (
        <ManagerLayout>
            <Head title="Rooms" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
                        <p className="mt-1 text-sm text-slate-500">Create rooms and assign students to them.</p>
                    </div>
                    {auth.user.can.create && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Create room
                        </button>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Room</th>
                                    <th className="px-4 py-3">Capacity</th>
                                    <th className="px-4 py-3">Occupancy</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.data.map((room) => {
                                    const full = room.students_count >= room.capacity;
                                    return (
                                        <tr key={room.id} className="transition hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{room.name}</td>
                                            <td className="px-4 py-3 text-slate-700">{room.capacity}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' +
                                                        (full
                                                            ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                                                            : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20')
                                                    }
                                                >
                                                    {room.students_count} / {room.capacity}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {auth.user.can.update && (
                                                    <>
                                                        <button
                                                            onClick={() => setAssigningRoom(room)}
                                                            className="rounded-md px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                                                        >
                                                            Assign student
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingRoom(room)}
                                                            className="rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                                                        >
                                                            Edit
                                                        </button>
                                                    </>
                                                )}
                                                {auth.user.can.delete && (
                                                    <button
                                                        onClick={() => destroy(room)}
                                                        className="rounded-md px-2 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {rooms.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center">
                                            <div className="text-sm font-medium text-slate-700">No rooms yet</div>
                                            <div className="mt-1 text-sm text-slate-500">Create the first room to get started.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {rooms.links?.length > 3 && (
                        <div className="flex justify-end gap-1 border-t border-slate-100 px-4 py-3">
                            {rooms.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={
                                        'rounded-md px-3 py-1 text-sm transition ' +
                                        (link.active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100') +
                                        (!link.url ? ' cursor-not-allowed opacity-40' : '')
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} />}
            {editingRoom && <EditRoomModal room={editingRoom} onClose={() => setEditingRoom(null)} />}
            {assigningRoom && <AssignStudentModal room={assigningRoom} onClose={() => setAssigningRoom(null)} />}
        </ManagerLayout>
    );
}

function CreateRoomModal({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        capacity: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('manager.rooms.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal title="Create room" onClose={onClose}>
            <form onSubmit={submit}>
                <Field label="Name" error={errors.name}>
                    <input
                        type="text"
                        autoFocus
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <Field label="Capacity" error={errors.capacity}>
                    <input
                        type="number"
                        min="1"
                        value={data.capacity}
                        onChange={(e) => setData('capacity', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <ModalActions onClose={onClose} processing={processing} label="Create room" />
            </form>
        </Modal>
    );
}

function EditRoomModal({ room, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: room.name,
        capacity: room.capacity,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('manager.rooms.update', room.id), { onSuccess: onClose });
    };

    return (
        <Modal title={`Edit ${room.name}`} onClose={onClose}>
            <form onSubmit={submit}>
                <Field label="Name" error={errors.name}>
                    <input
                        type="text"
                        autoFocus
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <Field label="Capacity" error={errors.capacity}>
                    <input
                        type="number"
                        min="1"
                        value={data.capacity}
                        onChange={(e) => setData('capacity', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <ModalActions onClose={onClose} processing={processing} label="Save changes" />
            </form>
        </Modal>
    );
}

function AssignStudentModal({ room, onClose }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        student_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('manager.rooms.assign-student', room.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal title={`Assign a student to ${room.name}`} onClose={onClose}>
            <p className="mb-4 text-sm text-slate-500">
                {room.students_count} / {room.capacity} seats taken.
            </p>
            <form onSubmit={submit}>
                <Field label="Student ID" error={errors.student_id}>
                    <input
                        type="number"
                        autoFocus
                        value={data.student_id}
                        onChange={(e) => setData('student_id', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <ModalActions onClose={onClose} processing={processing} label="Assign" />
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