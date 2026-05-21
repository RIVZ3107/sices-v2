import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_USUARIOS } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasUsuariosPage() {
    const actions = [
        { to: '/app/sistemas/usuarios', label: 'Nuevo usuario', variant: 'primary', icon: 'userPlus' },
        { to: '/app/sistemas/usuarios', label: 'Importar', variant: 'success', icon: 'arrowDownTray' },
        { to: '/app/sistemas/usuarios', label: 'Exportar', variant: 'purple', icon: 'arrowUpTray' },
        { to: '/app/sistemas/usuarios', label: 'Restablecer acceso', variant: 'orange', icon: 'lockOpen' },
        { to: '/app/sistemas/usuarios', label: 'Filtros', variant: 'muted', icon: 'funnel' },
        { to: '/app/sistemas/usuarios', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];
    const metrics = [
        { title: 'Usuarios activos', value: '212', trend: '↑ 12% vs. ciclo anterior', tone: 'blue' },
        { title: 'Cuentas bloqueadas', value: '18', trend: '↑ 3 vs. ayer', tone: 'red' },
        { title: 'Restablecimientos solicitados', value: '9', trend: '↑ 29% vs. ayer', tone: 'orange' },
        { title: 'Sesiones abiertas', value: '47', trend: '↑ 8% vs. ayer', tone: 'purple' },
        { title: 'Usuarios sin rol', value: '14', trend: '↓ 7% vs. ayer', tone: 'green' },
    ];

    return (
        <CeShell
            title="Usuarios y cuentas"
            subtitle="Administra las cuentas de usuario del sistema, accesos y estado de seguridad."
            actions={actions}
            metrics={metrics}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Acciones rápidas">
                        <ul className="space-y-3 text-sm text-slate-700">
                            <li>
                                <Link className="font-medium text-sky-700 hover:underline" to="/app/sistemas/usuarios">
                                    Nuevo usuario
                                </Link>
                            </li>
                            <li>
                                <Link className="font-medium text-sky-700 hover:underline" to="/app/sistemas/usuarios">
                                    Importar usuarios
                                </Link>
                            </li>
                            <li>
                                <Link className="font-medium text-sky-700 hover:underline" to="/app/sistemas/usuarios">
                                    Restablecer acceso
                                </Link>
                            </li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>Restablecimiento de acceso — admin.tecnico — Hace 32 min</li>
                            <li>Usuario bloqueado — ce.ensvt — Ayer 16:12</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Listado de usuarios">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar usuario, correo o institución…" />
                </div>
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Usuario</th>
                                <th className="px-2 py-2 text-left">Nombre</th>
                                <th className="px-2 py-2 text-left">Correo</th>
                                <th className="px-2 py-2 text-left">Rol</th>
                                <th className="px-2 py-2 text-left">Alcance</th>
                                <th className="px-2 py-2 text-left">Institución / Sede</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Último acceso</th>
                                <th className="px-2 py-2 text-left">MFA</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_USUARIOS.map((u) => (
                                <tr key={u.usuario} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-mono text-xs font-semibold text-sky-800">{u.usuario}</td>
                                    <td className="px-2 py-2 font-medium text-slate-900">{u.nombre}</td>
                                    <td className="px-2 py-2 text-slate-600">{u.correo}</td>
                                    <td className="px-2 py-2 text-xs font-semibold text-slate-800">{u.rol}</td>
                                    <td className="px-2 py-2 text-slate-600">{u.alcance}</td>
                                    <td className="px-2 py-2 text-slate-600">{u.institucionSede}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{u.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-slate-600">{u.ultimoAcceso}</td>
                                    <td className="px-2 py-2">
                                        {u.mfa === 'Sí' ? (
                                            <span className="inst-badge inst-badge-success text-xs">Sí</span>
                                        ) : (
                                            <span className="inst-badge inst-badge-danger text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <button type="button" className="hover:underline">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={SIS_USUARIOS.length} total={212} noun="usuarios" />
            </CeInstSurface>
        </CeShell>
    );
}
