import { Outlet } from 'react-router-dom';

export function AuthLayout() {
    return (
        <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
            <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="mb-1 text-lg font-semibold text-slate-900">SICES v2</h1>
                <p className="mb-4 text-sm text-slate-500">Control escolar institucional</p>
                <Outlet />
            </div>
        </main>
    );
}
