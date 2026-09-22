import StudentLayout from '@/Layouts/StudentLayout';
import { Head, router } from '@inertiajs/react';

export default function Absences({ absences }) {
    return (
        <StudentLayout>
            <Head title="Absences" />

            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">Absence history</h1>
                    <p className="mt-1 text-sm text-slate-500">Sessions you were marked absent for.</p>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    {absences.data.length === 0 ? (
                        <div className="px-4 py-12 text-center text-sm text-slate-500">
                            No absences recorded — nice.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {absences.data.map((a) => (
                                <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                    <div className="font-medium text-slate-900">{a.schedule?.subject}</div>
                                    <div className="text-slate-500">{a.date}</div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {absences.links.length > 3 && (
                        <div className="flex flex-wrap gap-1 border-t border-slate-100 px-4 py-3">
                            {absences.links.map((link, i) => (
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