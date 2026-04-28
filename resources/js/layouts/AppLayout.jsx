import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../authStore';
import { logout } from '../api/auth';
import { Sidebar } from './Sidebar';
import { PageHeader } from '../components/PageHeader';

export function AppLayout() {
    const user = getUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    async function onLogout() {
        try {
            await logout();
        } catch {
            // noop
        } finally {
            clearSession();
            navigate('/login');
        }
    }

    return (
        <div className="inst-layout-bg min-h-screen md:flex">
            <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="min-h-screen flex-1 p-4 md:p-6">
                <div className="sices-page">
                <div className="mb-4">
                    <PageHeader
                        title="SICES v2"
                        subtitle={`${location.pathname} · ${user?.name ?? 'Usuario'} · Rol: ${user?.roles?.[0] ?? 'sin rol'}`}
                        actions={(
                            <div className="flex items-center gap-2">
                                <button className="inst-btn inst-btn-secondary text-xs md:hidden" onClick={() => setSidebarOpen(true)}>
                                    Menu
                                </button>
                                <button className="inst-btn inst-btn-primary text-xs" onClick={onLogout}>
                                    Cerrar sesion
                                </button>
                            </div>
                        )}
                    />
                </div>
                <Outlet />
                </div>
            </main>
        </div>
    );
}
