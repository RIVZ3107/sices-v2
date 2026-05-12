import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DASHBOARD_ESTATUS_ALUMNOS, CE_DEMO_REPORTES_FRECUENTES, CE_PROGRAMAS, ceTotalAlumnosEstatus } from '../../data/controlEscolarDemoData';

function buildMiniDonut() {
    const segs = CE_DASHBOARD_ESTATUS_ALUMNOS;
    const total = ceTotalAlumnosEstatus();
    let acc = 0;
    const parts = segs.map((s) => {
        const start = acc;
        const span = (s.count / total) * 360;
        acc += span;
        return `${s.color} ${start}deg ${acc}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
}

export function ReportesCePage() {
    const actions = [
        { to: '/app/control-escolar/reportes', label: 'Reporte de matrícula', variant: 'primary', icon: 'barChart2' },
        { to: '/app/control-escolar/reportes', label: 'Reporte de reinscripciones', variant: 'success', icon: 'barChart2' },
        { to: '/app/control-escolar/reportes', label: 'Pendientes', variant: 'orange', icon: 'clock' },
        { to: '/app/control-escolar/reportes', label: 'Exportar PDF', variant: 'purple', icon: 'fileText' },
        { to: '/app/control-escolar/reportes', label: 'Exportar Excel', variant: 'muted', icon: 'table' },
        { to: '/app/control-escolar/reportes?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Matrícula activa', value: '2,845', trend: 'Normal / UPN', tone: 'blue' },
        { title: 'Inscripciones del ciclo', value: '312', trend: 'En seguimiento', tone: 'green' },
        { title: 'Reinscripciones', value: '516', trend: 'Proceso 2024-2025', tone: 'orange' },
        { title: 'Documentos observados', value: '27', trend: 'Bandeja operativa', tone: 'purple' },
    ];

    return (
        <CeShell
            title="Reportes e indicadores"
            subtitle="Indicadores académicos y administrativos. Sin reportes de pagos ni colegiaturas."
            actions={actions}
            metrics={metrics}
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Distribución por programa (referencia)">
                    <ul className="space-y-2 text-xs text-slate-700">
                        {CE_PROGRAMAS.slice(0, 5).map((p, i) => (
                            <li key={p} className="flex justify-between border-b border-slate-100 py-2">
                                <span className="pr-2">{p}</span>
                                <span className="font-bold text-slate-900">{120 + i * 40}</span>
                            </li>
                        ))}
                    </ul>
                </CeInstSurface>
                <CeInstSurface title="Estatus de alumnos">
                    <div className="ce-donut-wrap justify-center">
                        <div className="ce-donut h-40 w-40" style={{ background: buildMiniDonut() }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total text-lg">{ceTotalAlumnosEstatus().toLocaleString('es-MX')}</span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>
                    </div>
                </CeInstSurface>
                <CeInstSurface title="Indicadores clave">
                    <ul className="space-y-3 text-sm text-slate-700">
                        <li>Eficiencia de captura de calificaciones: 76%</li>
                        <li>Expedientes con documentación completa: 84%</li>
                        <li>Solicitudes de matrícula enviadas a ES: 14</li>
                    </ul>
                </CeInstSurface>
            </div>

            <CeInstSurface title="Reportes frecuentes" className="mt-4">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Reporte</th>
                                <th className="px-2 py-2 text-left">Ciclo</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_REPORTES_FRECUENTES.map((r) => (
                                <tr key={r.nombre} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.nombre}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.ciclo}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/admin/reportes-basicos">Abrir</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={9} total={24} noun="reportes" />
            </CeInstSurface>
        </CeShell>
    );
}
