import { CeInstSurface, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_PERMISOS_MATRIZ, SIS_ROLES_METRICAS, SIS_ROLES_TABLA } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

function CellMark({ ok }) {
    if (ok === true) {
        return <span className="text-emerald-600">✓</span>;
    }
    if (ok === false) {
        return <span className="text-slate-400">—</span>;
    }
    return <span className="text-red-500">−</span>;
}

export function SistemasRolesPermisosPage() {
    const actions = [
        { to: '/app/sistemas/roles-permisos', label: 'Nuevo rol', variant: 'primary', icon: 'plus' },
        { to: '/app/sistemas/roles-permisos', label: 'Clonar rol', variant: 'purple', icon: 'clipboardList' },
        { to: '/app/sistemas/roles-permisos', label: 'Asignar permisos', variant: 'success', icon: 'check' },
        { to: '/app/sistemas/roles-permisos', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
        { to: '/app/sistemas/roles-permisos', label: 'Filtros', variant: 'muted', icon: 'funnel' },
        { to: '/app/sistemas/roles-permisos', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];

    return (
        <CeShell
            title="Administración de roles y permisos"
            subtitle="Solo el rol sistemas y superadmin deben administrar roles y permisos en producción."
            actions={actions}
            metrics={SIS_ROLES_METRICAS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Permisos más usados">
                        <ul className="space-y-2 text-xs text-slate-700">
                            <li className="flex justify-between">
                                <span>usuarios.ver</span>
                                <span className="font-semibold text-sky-700">92%</span>
                            </li>
                            <li className="flex justify-between">
                                <span>documentos.ver</span>
                                <span className="font-semibold text-sky-700">88%</span>
                            </li>
                            <li className="flex justify-between">
                                <span>dashboard.ver</span>
                                <span className="font-semibold text-sky-700">85%</span>
                            </li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Cambios recientes" className="mt-4">
                        <p className="text-xs text-slate-600">Se asignaron permisos al rol Control Escolar — hace 2 h.</p>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Roles del sistema">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Rol</th>
                                <th className="px-2 py-2 text-left">Usuarios asignados</th>
                                <th className="px-2 py-2 text-left">Permisos</th>
                                <th className="px-2 py-2 text-left">Alcance</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_ROLES_TABLA.map((r) => (
                                <tr key={r.rol} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-semibold text-slate-900">{r.rol}</td>
                                    <td className="px-2 py-2">{r.usuarios}</td>
                                    <td className="px-2 py-2">{r.permisos}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.alcance}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-sky-700">Editar · Clonar</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
            </CeInstSurface>

            <CeInstSurface title="Permisos por módulo (rol Sistemas)" className="mt-4">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Módulo</th>
                                <th className="px-2 py-2 text-center">Ver</th>
                                <th className="px-2 py-2 text-center">Crear</th>
                                <th className="px-2 py-2 text-center">Editar</th>
                                <th className="px-2 py-2 text-center">Administrar</th>
                                <th className="px-2 py-2 text-center">Exportar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_PERMISOS_MATRIZ.map((row) => (
                                <tr key={row.modulo} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{row.modulo}</td>
                                    <td className="px-2 py-2 text-center">
                                        <CellMark ok={row.ver} />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <CellMark ok={row.crear} />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <CellMark ok={row.editar} />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <CellMark ok={row.administrar} />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <CellMark ok={row.exportar} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
            </CeInstSurface>
        </CeShell>
    );
}
