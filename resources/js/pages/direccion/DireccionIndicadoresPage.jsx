import { Link } from 'react-router-dom';
import { CeInstSurface, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import {
    CE_PROGRAMAS,
    DE_COMPARATIVO_SEMESTRE,
    DE_DASHBOARD_MATRICULA_POR_PROGRAMA,
    DE_INDICADORES_CLAVE,
    DE_INDICADORES_MONITOREADOS,
    DE_TENDENCIA_MENSUAL,
    deBuildDonutGradient,
    deTotalMatriculaPrograma,
} from '../../data/direccionEscuelaDemoData';

export function DireccionIndicadoresPage() {
    const actions = [
        { to: '/app/direccion/reportes', label: 'Exportar PDF', variant: 'purple', icon: 'fileText' },
        { to: '/app/direccion/reportes', label: 'Exportar Excel', variant: 'success', icon: 'table' },
        { to: '/app/direccion/indicadores?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Matrícula total', value: '2,845', trend: '↑ 6% vs. ciclo anterior', tone: 'blue' },
        { title: 'Eficiencia terminal', value: '68.4%', trend: '↑ 4.3 pp vs. ciclo anterior', tone: 'green' },
        { title: 'Tasa de reinscripción', value: '92.1%', trend: '↑ 3.2 pp vs. ciclo anterior', tone: 'purple' },
        { title: 'Expedientes completos', value: '94.2%', trend: '↑ 5.6 pp vs. ciclo anterior', tone: 'green' },
        { title: 'Incidencias abiertas', value: '23', trend: '↓ 12% vs. ciclo anterior', tone: 'orange' },
        { title: 'Promedio institucional', value: '8.76', trend: '↑ 0.18 vs. ciclo anterior', tone: 'blue' },
    ];

    const maxBar = Math.max(...DE_COMPARATIVO_SEMESTRE.flatMap((r) => [r.ant, r.act]), 1);

    return (
        <CeShell
            title="Indicadores institucionales"
            subtitle="Seguimiento estratégico de desempeño escolar. Consulta y exportación; sin edición directa de indicadores."
            actions={actions}
            metrics={metrics}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Tendencia mensual (matrícula)">
                    <div className="flex h-40 items-end justify-between gap-1 border-b border-slate-200 px-1">
                        {DE_TENDENCIA_MENSUAL.map((row) => {
                            const h = Math.round((row.actual / 3000) * 100);
                            const h2 = Math.round((row.anterior / 3000) * 100);
                            return (
                                <div key={row.mes} className="flex flex-1 flex-col items-center gap-1">
                                    <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
                                        <div className="w-1.5 rounded-t bg-slate-300" style={{ height: `${h2}%` }} title="Ciclo anterior" />
                                        <div className="w-2 rounded-t bg-sky-600" style={{ height: `${h}%` }} title="Ciclo actual" />
                                    </div>
                                    <span className="text-[10px] text-slate-500">{row.mes}</span>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Línea sólida: ciclo actual · Gris: ciclo anterior (referencia).</p>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver detalle de tendencia &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Distribución por programa">
                    <div className="ce-donut-wrap justify-center">
                        <div className="ce-donut h-40 w-40" style={{ background: deBuildDonutGradient(DE_DASHBOARD_MATRICULA_POR_PROGRAMA) }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total text-lg">{deTotalMatriculaPrograma().toLocaleString('es-MX')}</span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>
                        <div className="ce-legend text-xs">
                            {DE_DASHBOARD_MATRICULA_POR_PROGRAMA.map((r) => (
                                <div key={r.key} className="ce-legend-row">
                                    <span>
                                        <span style={{ color: r.color }}>●</span> {r.label}
                                    </span>
                                    <span>
                                        {r.count.toLocaleString('es-MX')} ({r.pct}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver detalle por programa &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Comparativo por semestre">
                    <ul className="space-y-3">
                        {DE_COMPARATIVO_SEMESTRE.map((r) => (
                            <li key={r.sem}>
                                <div className="mb-1 flex justify-between text-xs text-slate-600">
                                    <span>{r.sem} semestre</span>
                                </div>
                                <div className="flex h-6 gap-1">
                                    <div
                                        className="rounded bg-slate-300"
                                        style={{ width: `${(r.ant / maxBar) * 100}%` }}
                                        title="Anterior"
                                    />
                                    <div
                                        className="rounded bg-sky-600"
                                        style={{ width: `${(r.act / maxBar) * 100}%` }}
                                        title="Actual"
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver comparativo completo &gt;
                    </Link>
                </CeInstSurface>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <CeInstSurface title="Indicadores monitoreados">
                    <div className="ce-table-wrap">
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-2 py-2 text-left">Indicador</th>
                                    <th className="px-2 py-2 text-left">Meta</th>
                                    <th className="px-2 py-2 text-left">Avance</th>
                                    <th className="px-2 py-2 text-left">Variación</th>
                                    <th className="px-2 py-2 text-left">Estatus</th>
                                    <th className="px-2 py-2 text-left">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DE_INDICADORES_MONITOREADOS.map((row) => (
                                    <tr key={row.nombre} className="border-t border-slate-100">
                                        <td className="px-2 py-2 font-medium text-slate-900">{row.nombre}</td>
                                        <td className="px-2 py-2 text-slate-600">{row.meta}</td>
                                        <td className="px-2 py-2">
                                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-sky-600" style={{ width: `${row.avance}%` }} />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-emerald-700">{row.variacion}</td>
                                        <td className="px-2 py-2">
                                            <CeStatusBadge>{row.estatus}</CeStatusBadge>
                                        </td>
                                        <td className="px-2 py-2">
                                            <Link to="/app/direccion/reportes" className="text-sky-700">
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver todos los indicadores &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Indicadores clave">
                    <ul className="space-y-3 text-sm">
                        {DE_INDICADORES_CLAVE.map((row) => (
                            <li key={row.titulo} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{row.titulo}</p>
                                    <p className="text-xs text-slate-600">{row.desc}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="font-bold text-slate-900">{row.pct}</p>
                                    <CeStatusBadge>{row.estatus}</CeStatusBadge>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-xs text-slate-500">Programas de referencia: {CE_PROGRAMAS.slice(0, 4).join(' · ')}.</p>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver todos los indicadores clave &gt;
                    </Link>
                </CeInstSurface>
            </div>
        </CeShell>
    );
}
