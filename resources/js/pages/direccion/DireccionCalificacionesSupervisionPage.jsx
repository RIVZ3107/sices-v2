import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_CALIFICACIONES_TABLA, CE_DEMO_GRUPOS_CALIFICACION } from '../../data/direccionEscuelaDemoData';

export function DireccionCalificacionesSupervisionPage() {
    const actions = [
        { to: '/app/documentos/bandejas/en-revision', label: 'Validar actas institucionalmente', variant: 'primary', icon: 'check' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Autorizar corrección', variant: 'success', icon: 'pencil' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Ver incidencias', variant: 'orange', icon: 'alertTriangle' },
        { to: '/app/direccion/reportes', label: 'Exportar', variant: 'purple', icon: 'arrowDownTray' },
        { to: '/app/direccion/reportes', label: 'Reporte de calificaciones', variant: 'primary', icon: 'barChart2' },
        { to: '/app/direccion/calificaciones?historial=1', label: 'Histórico de cambios', variant: 'muted', icon: 'clock' },
    ];
    const metrics = [
        { title: 'Actas abiertas', value: '48', trend: '↑ 4% vs. ciclo anterior', tone: 'blue' },
        { title: 'Captura completada', value: '76%', trend: '↑ 6 pp vs. ciclo anterior', tone: 'green' },
        { title: 'Calificaciones pendientes', value: '128', trend: '↑ 8% vs. ciclo anterior', tone: 'orange' },
        { title: 'Correcciones solicitadas', value: '14', trend: '↓ 2% vs. ciclo anterior', tone: 'purple' },
        { title: 'Incidencias de captura', value: '9', trend: '↑ 1% vs. ciclo anterior', tone: 'red' },
        { title: 'Grupos validados', value: '112', trend: '↑ 11% vs. ciclo anterior', tone: 'green' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Pendientes de evaluación">
                <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex justify-between border-b border-slate-100 py-2">
                        <span>Actas sin cierre</span>
                        <span className="font-bold">12</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-100 py-2">
                        <span>Correcciones en trámite</span>
                        <span className="font-bold">14</span>
                    </li>
                    <li className="flex justify-between py-2">
                        <span>Grupos con captura incompleta</span>
                        <span className="font-bold">8</span>
                    </li>
                </ul>
            </CeInstSurface>
            <CeInstSurface title="Acciones rápidas" className="mt-4">
                <ul className="space-y-2 text-sm">
                    <li>
                        <Link to="/app/documentos/bandejas/en-revision" className="text-sky-700 hover:underline">
                            Abrir bandeja de actas
                        </Link>
                    </li>
                    <li>
                        <Link to="/app/direccion/reportes" className="text-sky-700 hover:underline">
                            Generar reporte de avance
                        </Link>
                    </li>
                </ul>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Supervisión de calificaciones"
            subtitle="Avance de captura y validación institucional. Este rol no captura calificaciones directamente."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <CeInstSurface title="Avance de captura por periodo / grupo">
                <ul className="space-y-4">
                    {CE_DEMO_GRUPOS_CALIFICACION.map((g) => (
                        <li key={g.grupo}>
                            <div className="mb-1 flex justify-between text-sm text-slate-800">
                                <span>{g.grupo}</span>
                                <span className="font-bold">{g.avancePct}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-sky-600" style={{ width: `${g.avancePct}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{g.pendientes} calificaciones pendientes · {g.sede}</p>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>

            <CeInstSurface title="Movimientos recientes de actas" className="mt-4">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Matrícula</th>
                                <th className="px-2 py-2 text-left">Materia</th>
                                <th className="px-2 py-2 text-left">Calif.</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_CALIFICACIONES_TABLA.map((r) => (
                                <tr key={`${r.matricula}-${r.materia}`} className="border-t border-slate-100">
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
                <CePaginationFoot showingFrom={1} showingTo={3} total={128} noun="registros" />
            </CeInstSurface>
        </CeShell>
    );
}
