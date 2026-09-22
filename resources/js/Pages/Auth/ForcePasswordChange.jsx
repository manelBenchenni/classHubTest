import { Head, useForm } from '@inertiajs/react';

const inputCls =
    'w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function ForcePasswordChange() {
    const { data, setData, put, processing, errors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('password.force.update'));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <Head title="Change your password" />

            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Set a new password</h1>
                <p className="mt-1 text-sm text-slate-500">
                    For security, you need to change your temporary password before continuing.
                </p>

                <form onSubmit={submit} className="mt-6">
                    <Field label="Temporary password" error={errors.current_password}>
                        <input
                            type="password"
                            autoFocus
                            autoComplete="current-password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="New password" error={errors.password}>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Confirm new password" error={errors.password_confirmation}>
                        <input
                            type="password"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {processing ? 'Saving…' : 'Update password'}
                    </button>
                </form>
            </div>
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