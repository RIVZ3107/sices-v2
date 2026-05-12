import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import {
    CE_DASHBOARD_ESTATUS_ALUMNOS,
    CE_DEMO_REPORTES_FRECUENTES,
    ceTotalAlumnosEstatus,
} from '../../data/controlEscolarDemoData';
import { DE_COMPARATIVO_SEMESTRE, DE_INDICADORES_CLAVE } from '../../data/direccionEscuelaDemoData';

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

const reportesDirector = CE_DEMO_REPORTES_FRECUENTES.filter(
    (r) => !/importaci/i.test(r.nombre) && !/solicitud de matr/i.test(r.nombre),
);

export function DireccionReportesPage() {
    const actions = [
        { to: '/app/direccion/reportes', label: 'Reporte de matrícula', variant: 'primary', icon: 'barChart2' },
        { to: '/app/direccion/reportes', label: 'Reporte de reinscripciones', variant: 'purple', icon: 'barChart2' },
        { to: '/app/direccion/reportes', label: 'Pendientes', variant: 'orange', icon: 'clock' },
        { to: '/app/direccion/reportes', label: 'Exportar PDF', variant: 'purple', icon: 'fileText' },
        { to: '/app/direccion/reportes', label: 'Exportar Excel', variant: 'success', icon: 'table' },
        { to: '/app/direccion/reportes?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Matrícula total', value: '2,845', trend: '↑ 11% vs. ciclo anterior', tone: 'blue' },
        { title: 'Reinscripciones', value: '2,126', trend: '↑ 7% vs. ciclo anterior', tone: 'green' },
        { title: 'Nuevas inscripciones', value: '512', trend: '↑ 9% vs. ciclo anterior', tone: 'purple' },
        { title: 'Expedientes completos', value: '1,964', trend: '↑ 10% vs. ciclo anterior', tone: 'green' },
        { title: 'Pendientes', value: '128', trend: '↓ 19% vs. ciclo anterior', tone: 'red' },
        { title: 'Alertas', value: '23', trend: '↑ 21% vs. ciclo anterior', tone: 'orange' },
    ];

    const maxBar = Math.max(...DE_COMPARATIVO_SEMESTRE.flatMap((r) => [r.ant, r.act]), 1);

    return (
        <CeShell
            title="Reportes e indicadores"
            subtitle="Consulta y exportación de reportes institucionales. Sin reportes de pagos, colegiaturas ni becas."
            actions={actions}
            metrics={metrics}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Matrícula por programa">
                    <div className="ce-donut-wrap justify-center">
                        <div className="ce-donut h-40 w-40" style={{ background: buildMiniDonut() }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total text-lg">{ceTotalAlumnosEstatus().toLocaleString('es-MX')}</span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>
                    </div>
                    <Link to="/app/direccion/indicadores" className="ce-link-more">
                        Ver detalle por programa &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Trámites por mes (referencia)">
                    <ul className="space-y-2 text-xs text-slate-700">
                        {['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'].map((mes, i) => (
                            <li key={mes} className="flex items-end gap-2">
                                <span className="w-8 shrink-0">{mes}</span>
                                <div className="flex flex-1 gap-1">
                                    <div className="h-3 flex-1 rounded bg-sky-600" style={{ width: `${40 + i * 8}%` }} />
                                    <div className="h-3 flex-1 rounded bg-violet-500" style={{ width: `${30 + i * 5}%` }} />
                                    <div className="h-3 flex-1 rounded bg-emerald-500" style={{ width: `${25 + i * 4}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-xs text-slate-500">Azul: inscripciones · Violeta: reinscripciones · Verde: otros trámites.</p>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver detalle &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Indicadores clave">
                    <ul className="space-y-3 text-sm">
                        {DE_INDICADORES_CLAVE.map((row) => (
                            <li key={row.titulo}>
                                <div className="flex justify-between text-slate-800">
                                    <span className="font-medium">{row.titulo}</span>
                                    <span className="font-bold">{row.pct}</span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-sky-600" style={{ width: '82%' }} />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Meta institucional · {row.estatus}</p>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/direccion/indicadores" className="ce-link-more">
                        Ver todos &gt;
                    </Link>
                </CeInstSurface>
            </div>

            <CeInstSurface title="Comparativo por semestre (referencia)" className="mt-4">
                <div className="grid gap-2 sm:grid-cols-4">
                    {DE_COMPARATIVO_SEMESTRE.map((r) => (
                        <div key={r.sem} className="rounded-lg border border-slate-100 p-3 text-center text-sm">
                            <p className="font-bold text-slate-900">{r.sem}</p>
                            <div className="mt-2 flex justify-center gap-1">
                                <span className="block h-16 w-4 rounded bg-slate-300" style={{ height: `${(r.ant / maxBar) * 80}px` }} />
                                <span className="block h-16 w-4 rounded bg-sky-600" style={{ height: `${(r.act / maxBar) * 80}px` }} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Gris: anterior · Azul: actual</p>
                        </div>
                    ))}
                </div>
            </CeInstSurface>

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
                            {reportesDirector.map((r) => (
                                <tr key={r.nombre} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.nombre}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.ciclo}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/direccion/reportes">Generar</Link>
                                        {' · '}
                                        <Link to="/app/direccion/reportes">Descargar</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={reportesDirector.length} total={24} noun="reportes" />
                <Link to="/app/direccion/reportes" className="ce-link-more">
                    Ver todos los reportes &gt;
                </Link>
            </CeInstSurface>
        </CeShell>
    );
}
