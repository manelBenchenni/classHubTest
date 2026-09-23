import { usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';

export default function NotificationBell() {
    const { auth } = usePage().props;
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Initial load, so refreshing the page still shows what's already there
    useEffect(() => {
        fetch(route('notifications.index'))
            .then((r) => r.json())
            .then((data) => {
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            });
    }, []);

    // Live updates over the user's own private channel
    useEffect(() => {
        const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);

        channel.notification((notification) => {
            setNotifications((prev) => [{ id: notification.id, data: notification, read_at: null, created_at: new Date().toISOString() }, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            window.Echo.leave(`App.Models.User.${auth.user.id}`);
        };
    }, [auth.user.id]);

    // Close dropdown on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const markAsRead = (notification) => {
        if (notification.read_at) return;

        fetch(route('notifications.read', notification.id), {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
        }).then(() => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        });
    };

    const markAllAsRead = () => {
        fetch(route('notifications.read-all'), {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
        }).then(() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
            setUnreadCount(0);
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                        <span className="text-sm font-semibold text-slate-700">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs font-medium text-indigo-600 hover:underline">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications</div>
                        )}

                        {notifications.map((n) => (
                            <button
                                key={n.id}
                                onClick={() => markAsRead(n)}
                                className={
                                    'block w-full border-b border-slate-50 px-4 py-3 text-left text-sm transition last:border-0 hover:bg-slate-50 ' +
                                    (n.read_at ? 'text-slate-500' : 'bg-indigo-50/50 font-medium text-slate-900')
                                }
                            >
                                {n.data.message}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}