import StudentLayout from '@/Layouts/StudentLayout';
import { Head, router } from '@inertiajs/react';

const statusStyles = {
    present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    absent: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default function Index({ attendances, absenceCount }) {
    return (
        <StudentLayout>
            <Head title="My attendance" />

            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">My attendance</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {absenceCount} {absenceCount === 1 ? 'absence' : 'absences'} recorded so far.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Room</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attendances.data.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-700">{a.date}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{a.schedule?.subject}</td>
                                    <td className="px-4 py-3 text-slate-700">{a.schedule?.room?.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ' + statusStyles[a.status]}>
                                            {a.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {attendances.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                                        No attendance records yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {attendances.links?.length > 3 && (
                        <div className="flex justify-end gap-1 border-t border-slate-100 px-4 py-3">
                            {attendances.links.map((link, i) => (
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
        </StudentLayout>
    );
}