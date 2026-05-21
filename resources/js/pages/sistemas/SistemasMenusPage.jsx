import { CeInstSurface, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_MENUS_TABLA } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasMenusPage() {
    const actions = [
        { to: '/app/sistemas/menus', label: 'Nuevo menú', variant: 'primary', icon: 'plus' },
        { to: '/app/sistemas/menus', label: 'Nuevo submenú', variant: 'success', icon: 'plus' },
        { to: '/app/sistemas/menus', label: 'Ordenar', variant: 'muted', icon: 'arrowsLeftRight' },
        { to: '/app/sistemas/menus', label: 'Asignar a roles', variant: 'muted', icon: 'users' },
        { to: '/app/sistemas/menus', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
        { to: '/app/sistemas/menus', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Menús activos', value: '10', trend: '100% del total', tone: 'blue' },
        { title: 'Submenús registrados', value: '28', trend: 'En todos los módulos', tone: 'green' },
        { title: 'Menús ocultos', value: '1', trend: 'No visibles en navegación', tone: 'orange' },
        { title: 'Cambios recientes', value: '12', trend: 'Últimos 7 días', tone: 'purple' },
    ];

    return (
        <CeShell
            title="Menús del sistema"
            subtitle="Los menús se filtran por permisos asociados; un rol no debe ver entradas sin permiso."
            actions={actions}
            metrics={metrics}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Vista previa de navegación">
                        <div className="rounded-xl bg-gradient-to-b from-[#001f3f] to-[#0b1738] p-3 text-[10px] text-white">
                            <p className="font-bold">SICES v2</p>
                            <p className="mt-2 rounded bg-sky-600 px-2 py-1 text-[10px] font-semibold">Menús</p>
                            <p className="mt-1 opacity-80">Dashboard</p>
                            <p className="mt-1 flex items-center gap-1 opacity-60">
                                Reportes <span className="text-[9px]">(oculto)</span>
                            </p>
                        </div>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>Se ocultó el menú Reportes — hace 1 h</li>
                            <li>Se creó el submenú Asignaciones — hace 42 min</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Estructura de menús">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Nombre</th>
                                <th className="px-2 py-2 text-left">Ruta</th>
                                <th className="px-2 py-2 text-left">Ícono</th>
                                <th className="px-2 py-2 text-left">Orden</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Visible</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_MENUS_TABLA.map((m) => (
                                <tr key={m.nombre} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{m.nombre}</td>
                                    <td className="px-2 py-2 font-mono text-xs text-slate-600">{m.ruta}</td>
                                    <td className="px-2 py-2 text-xs">{m.icono}</td>
                                    <td className="px-2 py-2">{m.orden}</td>
                                    <td className="px-2 py-2 text-slate-600">{m.tipo}</td>
                                    <td className="px-2 py-2">{m.visible ? 'Sí' : 'No'}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{m.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-sky-700">⋯</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
            </CeInstSurface>
        </CeShell>
    );
}
