import { useMemo, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser } from '../authStore';
import { debeUsarLayoutCertificacionRc } from '../utils/certificacionRoutes';
import { CertIcons } from '../components/certificacion/CertIcons';
import { CERT_NAV_ITEMS } from '../utils/certificacionNav';
import { userCanAny } from '../utils/userPermissions';
import '../styles/certificacion.css';

function userInitials(name) {
    return (name ?? 'US')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}

export function CertificacionLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const user = getUser();

    if (!debeUsarLayoutCertificacionRc()) {
        let destino = '/app/educacion-superior/certificacion';
        if (location.pathname.includes('/revision')) {
            destino = location.pathname.replace('/app/certificacion', '/app/educacion-superior') + location.search;
        }
        return <Navigate to={destino} replace />;
    }

    const navVisible = useMemo(
        () => CERT_NAV_ITEMS.filter((item) => userCanAny(item.permissions)),
        [user?.permissions],
    );

    const pageTitle = useMemo(() => {
        const match = CERT_NAV_ITEMS.find((i) => location.pathname.startsWith(i.to));
        if (match) return match.label;
        if (location.pathname.includes('/revision')) return 'Revisión institucional';
        return 'Certificación';
    }, [location.pathname]);

    return (
        <div className={`cert-shell ${collapsed ? 'cert-sidebar-collapsed' : ''}`}>
            <aside className={`cert-sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="cert-sidebar-brand">
                    <h2>CERTIFICACIÓN</h2>
                    <p>SICES v2</p>
                    <p className="cert-sidebar-area">Responsable de Certificación</p>
                </div>
                <nav className="cert-nav" aria-label="Menú certificación">
                    {navVisible.map((item) => (
                        <NavLink
                            key={item.key}
                            to={item.to}
                            className={({ isActive }) => (isActive ? 'active' : '')}
                            title={item.label}
                        >
                            {CertIcons[item.icon] ?? CertIcons.docs}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="cert-sidebar-foot">
                    <button
                        type="button"
                        className="cert-tab-btn"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: 'none' }}
                        onClick={() => setCollapsed((v) => !v)}
                        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    >
                        {collapsed ? CertIcons.expand : CertIcons.collapse}
                        {!collapsed ? <span style={{ marginLeft: 8 }}>Colapsar menú</span> : null}
                    </button>
                </div>
            </aside>

            <div className="cert-main">
                <header className="cert-topbar">
                    <div>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Módulo institucional</p>
                        <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{pageTitle}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                            {CertIcons.bell}
                            Notificaciones
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <span
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: '#185FA5',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                {userInitials(user?.name)}
                            </span>
                            <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user?.name ?? 'Usuario'}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Certificación electrónica</p>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="cert-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
