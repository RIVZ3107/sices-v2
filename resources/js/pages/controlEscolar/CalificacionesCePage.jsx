import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_CALIFICACIONES_TABLA, CE_DEMO_GRUPOS_CALIFICACION } from '../../data/controlEscolarDemoData';

export function CalificacionesCePage() {
    const actions = [
        { to: '/app/coordinador/dashboard', label: 'Capturar calificación', variant: 'primary', icon: 'pencil' },
        { to: '/app/importaciones', label: 'Importar calificaciones', variant: 'success', icon: 'arrowDownTray' },
        { to: '/app/control-escolar/calificaciones', label: 'Solicitar corrección', variant: 'orange', icon: 'cornerUpLeft' },
        { to: '/app/control-escolar/calificaciones', label: 'Ver historial', variant: 'purple', icon: 'scrollText' },
        { to: '/app/control-escolar/reportes', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
    ];
    const metrics = [
        { title: 'Grupos en captura', value: '14', trend: 'Ciclo 2024-2025', tone: 'blue' },
        { title: 'Avance global', value: '76%', trend: '↑ vs. semana anterior', tone: 'green' },
        { title: 'Pendientes de captura', value: '118', trend: 'Por cerrar periodo', tone: 'orange' },
        { title: 'Correcciones solicitadas', value: '9', trend: 'En flujo con Dirección', tone: 'purple' },
    ];

    return (
        <CeShell
            title="Calificaciones"
            subtitle="Captura e importación operativa. La autorización final de correcciones y el cierre global del periodo no corresponden a Control Escolar."
            actions={actions}
            metrics={metrics}
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Avance de captura" className="lg:col-span-1">
                    <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[76%] rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-sm text-slate-600">76% de calificaciones capturadas en el ciclo activo.</p>
                </CeInstSurface>
                <CeInstSurface title="Grupos / materias" className="lg:col-span-2">
                    <ul className="space-y-3 text-sm">
                        {CE_DEMO_GRUPOS_CALIFICACION.map((g) => (
                            <li key={g.grupo} className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">{g.grupo}</p>
                                    <p className="text-xs text-slate-500">{g.sede}</p>
                                </div>
                                <div className="text-right text-xs">
                                    <p className="font-bold text-sky-800">{g.avancePct}% capturado</p>
                                    <p className="text-amber-700">{g.pendientes} pendientes</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CeInstSurface>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3">
                    <CeInstSurface title="Acciones rápidas">
                        <ul className="space-y-2 text-sm text-sky-800">
                            <li>
                                <Link to="/app/importaciones" className="hover:underline">
                                    Abrir importación académica
                                </Link>
                            </li>
                            <li>
                                <Link to="/app/observaciones" className="hover:underline">
                                    Ver observaciones de captura
                                </Link>
                            </li>
                            <li>
                                <Link to="/app/expedientes" className="hover:underline">
                                    Abrir expediente 360
                                </Link>
                            </li>
                        </ul>
                    </CeInstSurface>
                </div>
                <div className="lg:col-span-9">
                    <CeInstSurface title="Calificaciones del grupo seleccionado">
                        <div className="ce-table-wrap">
                            <table className="inst-table min-w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left">Alumno</th>
                                        <th className="px-2 py-2 text-left">Matrícula</th>
                                        <th className="px-2 py-2 text-left">Materia</th>
                                        <th className="px-2 py-2 text-left">Calificación</th>
                                        <th className="px-2 py-2 text-left">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CE_DEMO_CALIFICACIONES_TABLA.map((r) => (
                                        <tr key={r.matricula + r.materia} className="border-t border-slate-100">
                                            <td className="px-2 py-2 font-medium text-slate-900">{r.alumno}</td>
                                            <td className="px-2 py-2 text-sky-700">{r.matricula}</td>
                                            <td className="px-2 py-2 text-slate-700">{r.materia}</td>
                                            <td className="px-2 py-2">{r.calif}</td>
                                            <td className="px-2 py-2">
                                                <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <CePaginationFoot showingFrom={1} showingTo={3} total={42} />
                    </CeInstSurface>
                </div>
            </div>
        </CeShell>
    );
}
