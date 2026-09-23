import ManagerLayout from '@/Layouts/ManagerLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const roleLabels = {
    principal_manager: 'Principal manager',
    secondary_manager: 'Secondary manager',
    teacher: 'Teacher',
    student: 'Student',
};

const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    disabled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const inputCls =
    'w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Index({ users, filters, rooms }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showCreate, setShowCreate] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [assigningStudent, setAssigningStudent] = useState(null);
    const debounceRef = useRef(null);

    const hasFilters = search || role || status;

    /**
     * Mirrors the backend guards in UserController@update/@destroy:
     * - principal manager's account: only the principal themself
     * - a secondary manager's account: only the principal, or that same secondary manager
     * - everyone else (teacher/student): anyone with the relevant Gate permission
     */
    const canManageThisUser = (user) => {
        if (user.role === 'principal_manager') return auth.user.id === user.id;
        if (user.role === 'secondary_manager') {
            return auth.user.id === user.id || auth.user.role === 'principal_manager';
        }
        return true;
    };

    const applyFilters = (overrides = {}) => {
        router.get(
            route('manager.users.index'),
            {
                search: overrides.search ?? search,
                role: overrides.role ?? role,
                status: overrides.status ?? status,
            },
            { preserveState: true, replace: true }
        );
    };

    const onSearchChange = (value) => {
        setSearch(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilters({ search: value }), 400);
    };

    const onRoleChange = (value) => {
        setRole(value);
        applyFilters({ role: value });
    };

    const onStatusChange = (value) => {
        setStatus(value);
        applyFilters({ status: value });
    };

    const clearFilters = () => {
        setSearch('');
        setRole('');
        setStatus('');
        applyFilters({ search: '', role: '', status: '' });
    };

    const destroy = (user) => {
        if (confirm(`Delete ${user.name}? This can't be undone.`)) {
            router.delete(route('manager.users.destroy', user.id));
        }
    };

    const acceptUser = (user) => {
        router.patch(route('manager.users.accept', user.id), {}, { preserveScroll: true });
    };

    const rejectUser = (user) => {
        if (confirm(`Reject ${user.name}'s registration?`)) {
            router.patch(route('manager.users.reject', user.id), {}, { preserveScroll: true });
        }
    };

    const toggleStatus = (user) => {
        const question =
            user.status === 'active'
                ? `Disable ${user.name}? They will be signed out immediately.`
                : `Re-activate ${user.name}?`;

        if (confirm(question)) {
            router.patch(route('manager.users.toggle-status', user.id), {}, { preserveScroll: true });
        }
    };

    return (
        <ManagerLayout>
            <Head title="Users" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
                        <p className="mt-1 text-sm text-slate-500">Create, review and manage accounts.</p>
                    </div>
                    {auth.user.can.create && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Create user
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <svg
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={inputCls + ' pl-9'}
                        />
                    </div>

                    <select value={role} onChange={(e) => onRoleChange(e.target.value)} className={inputCls + ' sm:w-44'}>
                        <option value="">All roles</option>
                        {Object.entries(roleLabels).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>

                    <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={inputCls + ' sm:w-44'}>
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                        <option value="disabled">Disabled</option>
                    </select>

                    {hasFilters && (
                        <button onClick={clearFilters} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                            Clear
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Room</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.map((user) => {
                                    const manageable = canManageThisUser(user);

                                    return (
                                        <tr key={user.id} className="transition hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={user.name} />
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-slate-900">
                                                            {user.name}{' '}
                                                            <span className="font-normal text-slate-400">#{user.id}</span>
                                                        </div>
                                                        <div className="truncate text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                {roleLabels[user.role] ?? user.role}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ' +
                                                        (statusStyles[user.status] ?? statusStyles.disabled)
                                                    }
                                                >
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {user.role === 'student' ? (
                                                    user.room ? (
                                                        <span>{user.room.name}</span>
                                                    ) : (
                                                        <span className="text-slate-400">Unassigned</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {user.status === 'pending' && manageable && auth.user.can.update && (
                                                    <>
                                                        <button
                                                            onClick={() => acceptUser(user)}
                                                            className="rounded-md px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => rejectUser(user)}
                                                            className="rounded-md px-2 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {(user.status === 'active' || user.status === 'disabled') &&
                                                    user.role !== 'principal_manager' &&
                                                    manageable &&
                                                    auth.user.can.update && (
                                                        <button
                                                            onClick={() => toggleStatus(user)}
                                                            className={
                                                                'rounded-md px-2 py-1 text-sm font-medium hover:bg-slate-100 ' +
                                                                (user.status === 'active' ? 'text-slate-600' : 'text-emerald-600')
                                                            }
                                                        >
                                                            {user.status === 'active' ? 'Disable' : 'Activate'}
                                                        </button>
                                                    )}

                                                {user.role === 'student' && auth.user.can.update && (
                                                    <button
                                                        onClick={() => setAssigningStudent(user)}
                                                        className="rounded-md px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                                                    >
                                                        {user.room ? 'Change room' : 'Assign room'}
                                                    </button>
                                                )}

                                                {manageable && auth.user.can.update && (
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {user.role !== 'principal_manager' && manageable && auth.user.can.delete && (
                                                    <button
                                                        onClick={() => destroy(user)}
                                                        className="rounded-md px-2 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <div className="text-sm font-medium text-slate-700">No users found</div>
                                            <div className="mt-1 text-sm text-slate-500">
                                                {hasFilters ? 'Try changing or clearing your filters.' : 'Create the first user to get started.'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {(users.total > 0 || users.links.length > 3) && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
                            <div className="text-xs text-slate-500">
                                {users.total !== undefined && users.from
                                    ? `Showing ${users.from}–${users.to} of ${users.total}`
                                    : ''}
                            </div>
                            {users.links.length > 3 && (
                                <div className="flex flex-wrap gap-1">
                                    {users.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={
                                                'rounded-md px-3 py-1 text-sm transition ' +
                                                (link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100') +
                                                (!link.url ? ' cursor-not-allowed opacity-40' : '')
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
            {assigningStudent && (
                <AssignRoomModal
                    student={assigningStudent}
                    rooms={rooms}
                    onClose={() => setAssigningStudent(null)}
                />
            )}
        </ManagerLayout>
    );
}

function CreateUserModal({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        role: 'student',
        can_view: true,
        can_create: false,
        can_update: false,
        can_delete: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('manager.users.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal title="Create user" onClose={onClose}>
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

                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <Field label="Role" error={errors.role}>
                    <select value={data.role} onChange={(e) => setData('role', e.target.value)} className={inputCls}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="secondary_manager">Secondary manager</option>
                    </select>
                </Field>

                {data.role === 'secondary_manager' && (
                    <div className="mb-4 rounded-lg border border-slate-200 p-3">
                        <div className="mb-2 text-sm font-medium text-slate-700">Permissions</div>
                        <div className="grid grid-cols-2 gap-2">
                            {['can_view', 'can_create', 'can_update', 'can_delete'].map((perm) => (
                                <label key={perm} className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={data[perm]}
                                        onChange={(e) => setData(perm, e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {perm.replace('can_', '').replace(/^\w/, (c) => c.toUpperCase())}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <ModalActions onClose={onClose} processing={processing} label="Create user" />
            </form>
        </Modal>
    );
}

function EditUserModal({ user, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('manager.users.update', user.id), { onSuccess: onClose });
    };

    return (
        <Modal title={`Edit ${user.name}`} onClose={onClose}>
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

                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <ModalActions onClose={onClose} processing={processing} label="Save changes" />
            </form>
        </Modal>
    );
}

function AssignRoomModal({ student, rooms, onClose }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        student_id: student.id,
        room_id: student.room?.id ? String(student.room.id) : '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('manager.rooms.assign-student', data.room_id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const removeFromRoom = () => {
        if (confirm(`Remove ${student.name} from ${student.room.name}?`)) {
            router.delete(route('manager.rooms.remove-student', [student.room.id, student.id]), {
                onSuccess: onClose,
            });
        }
    };

    return (
        <Modal title={`Assign a room to ${student.name}`} onClose={onClose}>
            <form onSubmit={submit}>
                <Field label="Room" error={errors.room_id ?? errors.student_id}>
                    <select
                        value={data.room_id}
                        onChange={(e) => setData('room_id', e.target.value)}
                        className={inputCls}
                    >
                        <option value="">Select a room…</option>
                        {rooms.map((room) => {
                            const full = room.students_count >= room.capacity;
                            const isCurrentRoom = student.room?.id === room.id;
                            return (
                                <option key={room.id} value={room.id} disabled={full && !isCurrentRoom}>
                                    {room.name} ({room.students_count}/{room.capacity})
                                    {full ? ' — full' : ''}
                                </option>
                            );
                        })}
                    </select>
                </Field>

                <div className="mt-6 flex items-center justify-between">
                    {student.room ? (
                        <button
                            type="button"
                            onClick={removeFromRoom}
                            className="text-sm font-medium text-rose-600 hover:underline"
                        >
                            Remove from room
                        </button>
                    ) : (
                        <span />
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.room_id}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : 'Assign'}
                        </button>
                    </div>
                </div>
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

function Avatar({ name }) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
            {initials}
        </span>
    );
}