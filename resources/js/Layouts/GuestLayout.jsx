import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
            <Link href="/" className="mb-6">
                <ApplicationLogo className="h-14 w-14 fill-current text-indigo-600" />
            </Link>

            <div className="w-full bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200 sm:max-w-md sm:rounded-2xl sm:px-8">
                {children}
            </div>
        </div>
    );
}