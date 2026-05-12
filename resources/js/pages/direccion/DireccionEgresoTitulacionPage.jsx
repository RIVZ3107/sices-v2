import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import {
    DE_EGRESO_ACTIVIDAD,
    DE_EGRESO_DONA,
    DE_EGRESO_PRIORITARIOS,
    DE_EGRESO_PROCESO,
    DE_EGRESO_TRAMITES,
    deBuildDonutGradient,
} from '../../data/direccionEscuelaDemoData';

function totalEgresoDona() {
    return DE_EGRESO_DONA.reduce((s, r) => s + r.count, 0);
}

export function DireccionEgresoTitulacionPage() {
    const actions = [
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Autorizar egreso', variant: 'success', icon: 'check' },
        { to: '/app/expedientes', label: 'Revisar expediente', variant: 'purple', icon: 'folder' },
        { to: '/app/direccion/egreso-titulacion', label: 'Ver candidatos', variant: 'primary', icon: 'users' },
        { to: '/app/direccion/egreso-titulacion', label: 'Observar expediente', variant: 'orange', icon: 'alertTriangle' },
        { to: '/app/direccion/reportes', label: 'Exportar', variant: 'muted', icon: 'arrowDownTray' },
        { to: '/app/direccion/egreso-titulacion?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Candidatos a egreso', value: '186', trend: '↑ 8% vs. ciclo anterior', tone: 'blue' },
        { title: 'Expedientes listos', value: '135', trend: '↑ 10% vs. ciclo anterior', tone: 'green' },
        { title: 'Titulaciones en proceso', value: '67', trend: '↑ 12% vs. ciclo anterior', tone: 'purple' },
        { title: 'Documentos emitidos', value: '412', trend: '↑ 15% vs. ciclo anterior', tone: 'orange' },
        { title: 'Folios asignados', value: '248', trend: '↑ 9% vs. ciclo anterior', tone: 'blue' },
        { title: 'Incidencias', value: '23', trend: '↑ 21% vs. ciclo anterior', tone: 'red' },
    ];

    const total = totalEgresoDona();

    const rightPanel = (
        <>
            <CeInstSurface title="Acciones prioritarias">
                <ul className="space-y-2 text-sm">
                    {DE_EGRESO_PRIORITARIOS.map((p) => (
                        <li key={p.label} className="flex items-center justify-between border-b border-slate-100 py-2">
                            <Link to={p.to} className="text-slate-700 hover:text-sky-700">
                                {p.label}
                            </Link>
                            <span className="font-bold text-red-600">{p.n}</span>
                        </li>
                    ))}
                </ul>
                <Link to="/app/direccion/egreso-titulacion" className="ce-link-more">
                    Ver todas las acciones &gt;
                </Link>
            </CeInstSurface>
            <CeInstSurface title="Actividad reciente" className="mt-4">
                <ul className="space-y-3 text-sm">
                    {DE_EGRESO_ACTIVIDAD.map((a, i) => (
                        <li key={i} className="border-l-2 border-sky-200 pl-3">
                            <p className="text-slate-800">{a.texto}</p>
                            <p className="text-xs text-slate-500">{a.hora}</p>
                        </li>
                    ))}
                </ul>
                <Link to="/app/direccion/autorizaciones-observaciones" className="ce-link-more">
                    Ver toda la actividad &gt;
                </Link>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Egreso y titulación"
            subtitle="Seguimiento institucional de procesos de egreso y titulación (Normal / UPN)."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <div className="grid gap-4 lg:grid-cols-2">
                <CeInstSurface title="Estatus de egreso">
                    <div className="ce-donut-wrap justify-center">
                        <div className="ce-donut h-40 w-40" style={{ background: deBuildDonutGradient(DE_EGRESO_DONA) }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total text-lg">{total}</span>
                                <span className="ce-donut-label">Candidatos</span>
                            </div>
                        </div>
                        <div className="ce-legend text-xs">
                            {DE_EGRESO_DONA.map((r) => (
                                <div key={r.label} className="ce-legend-row">
                                    <span>
                                        <span style={{ color: r.color }}>●</span> {r.label}
                                    </span>
                                    <span>
                                        {r.count} ({r.pct}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/direccion/egreso-titulacion" className="ce-link-more">
                        Ver detalle de estatus &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Avance del proceso institucional">
                    <ul className="space-y-3">
                        {DE_EGRESO_PROCESO.map((p) => (
                            <li key={p.etiqueta}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span>{p.etiqueta}</span>
                                    <span className="font-bold">{p.pct}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-sky-600" style={{ width: `${p.pct}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/direccion/reportes" className="ce-link-more">
                        Ver todos los procesos &gt;
                    </Link>
                </CeInstSurface>
            </div>

            <CeInstSurface title="Trámites recientes de egreso y titulación" className="mt-4">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Trámite</th>
                                <th className="px-2 py-2 text-left">Fase actual</th>
                                <th className="px-2 py-2 text-left">Fecha solicitud</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DE_EGRESO_TRAMITES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2">
                                        <div className="font-medium text-slate-900">{r.alumno}</div>
                                        <div className="text-xs text-slate-500">{r.matricula}</div>
                                    </td>
                                    <td className="px-2 py-2 text-slate-700">{r.programa}</td>
                                    <td className="px-2 py-2">{r.tramite}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.fase}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 font-mono text-xs">{r.folio}</td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Ver</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={3} total={186} />
                <Link to="/app/direccion/egreso-titulacion" className="ce-link-more">
                    Ver todos los trámites &gt;
                </Link>
            </CeInstSurface>
        </CeShell>
    );
}
