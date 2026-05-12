import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { DE_ALERTAS_ALUMNOS, DE_DEMO_ALUMNOS, DE_DISTRIBUCION_ESTATUS, deBuildDonutGradient, deTotalAlumnosEstatus } from '../../data/direccionEscuelaDemoData';

export function DireccionAlumnosPage() {
    const actions = [
        { to: '/app/expedientes', label: 'Ver expediente', variant: 'primary', icon: 'folder' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Autorizar movimiento', variant: 'success', icon: 'check' },
        { to: '/app/direccion/reportes', label: 'Exportar', variant: 'purple', icon: 'arrowDownTray' },
        { to: '/app/direccion/alumnos?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];
    const metrics = [
        { title: 'Alumnos activos', value: '2,845', trend: '↑ 11% vs. ciclo anterior', tone: 'blue' },
        { title: 'Bajas temporales', value: '196', trend: '↓ 9% vs. ciclo anterior', tone: 'orange' },
        { title: 'Egresados', value: '312', trend: '↑ 10% vs. ciclo anterior', tone: 'purple' },
        { title: 'Expedientes incompletos', value: '128', trend: '↑ 12% vs. ciclo anterior', tone: 'red' },
        { title: 'Alumnos en riesgo', value: '87', trend: '↑ 15% vs. ciclo anterior', tone: 'orange' },
        { title: 'Alumnos con seguimiento', value: '64', trend: '↑ 8% vs. ciclo anterior', tone: 'green' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Acciones rápidas">
                <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex gap-2">
                        <span className="text-sky-600">●</span>
                        <Link to="/app/expedientes" className="font-medium text-sky-700 hover:underline">
                            Ver expediente institucional
                        </Link>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-emerald-600">●</span>
                        <Link to="/app/direccion/autorizaciones-observaciones" className="font-medium text-sky-700 hover:underline">
                            Autorizar movimiento
                        </Link>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-violet-600">●</span>
                        <Link to="/app/direccion/autorizaciones-observaciones" className="font-medium text-sky-700 hover:underline">
                            Asignar seguimiento
                        </Link>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-amber-600">●</span>
                        <Link to="/app/direccion/autorizaciones-observaciones" className="font-medium text-sky-700 hover:underline">
                            Asignar tutor
                        </Link>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-sky-600">●</span>
                        <Link to="/app/direccion/notificaciones" className="font-medium text-sky-700 hover:underline">
                            Enviar comunicación
                        </Link>
                    </li>
                </ul>
            </CeInstSurface>
            <CeInstSurface title="Alertas de alumnos" className="mt-4">
                <ul className="space-y-2 text-sm">
                    {DE_ALERTAS_ALUMNOS.map((a) => (
                        <li key={a.label} className="flex items-center justify-between border-b border-slate-100 py-2">
                            <span className="text-slate-700">{a.label}</span>
                            <span className={`font-bold ${a.tone === 'red' ? 'text-red-600' : a.tone === 'orange' ? 'text-amber-600' : 'text-sky-700'}`}>{a.n}</span>
                        </li>
                    ))}
                </ul>
                <Link to="/app/direccion/autorizaciones-observaciones" className="ce-link-more">
                    Ver todas &gt;
                </Link>
            </CeInstSurface>
        </>
    );

    const totalDonut = deTotalAlumnosEstatus();

    return (
        <CeShell
            title="Seguimiento de alumnos"
            subtitle="Consulta ejecutiva y acciones de supervisión institucional (Educación Normal y UPN)."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <CeInstSurface title="Listado de alumnos">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar alumno por nombre o matrícula…" />
                    <span className="text-xs text-slate-600">Mostrando 1 a 6 de 2,845</span>
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Matrícula</th>
                                <th className="px-2 py-2 text-left">Nombre</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Semestre / periodo</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Riesgo</th>
                                <th className="px-2 py-2 text-left">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DE_DEMO_ALUMNOS.map((r) => (
                                <tr key={r.matricula} className="border-t border-slate-100">
                                    <td className="px-2 py-2">
                                        <Link to="/app/expedientes" className="font-semibold text-sky-700 hover:underline">
                                            {r.matricula}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.nombre}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.programa}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.periodo}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2">
                                        <span
                                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                                                r.riesgo === 'Alto' ? 'bg-red-500' : r.riesgo === 'Medio' ? 'bg-amber-400' : 'bg-emerald-500'
                                            }`}
                                            title={r.riesgo}
                                        />
                                        <span className="ml-1 text-xs text-slate-600">{r.riesgo}</span>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Ver</Link>
                                        {' · '}
                                        <Link to="/app/direccion/autorizaciones-observaciones">Seguimiento</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={6} total={2845} />
                <Link to="/app/expedientes" className="ce-link-more">
                    Ver todos los alumnos &gt;
                </Link>
            </CeInstSurface>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <CeInstSurface title="Alumnos recientes">
                    <ul className="space-y-3">
                        {DE_DEMO_ALUMNOS.slice(0, 3).map((a) => (
                            <li key={a.matricula} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
                                    {a.nombre
                                        .split(' ')
                                        .slice(0, 2)
                                        .map((p) => p[0])
                                        .join('')}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">{a.nombre}</p>
                                    <p className="text-xs text-slate-500">{a.matricula}</p>
                                    <div className="mt-1">
                                        <CeStatusBadge>{a.estatus}</CeStatusBadge>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CeInstSurface>
                <CeInstSurface title="Distribución por estatus">
                    <div className="ce-donut-wrap">
                        <div className="ce-donut h-36 w-36" style={{ background: deBuildDonutGradient(DE_DISTRIBUCION_ESTATUS) }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total text-lg">{totalDonut.toLocaleString('es-MX')}</span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>
                        <div className="ce-legend">
                            {DE_DISTRIBUCION_ESTATUS.map((r) => (
                                <div key={r.key} className="ce-legend-row text-xs">
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
                </CeInstSurface>
            </div>
        </CeShell>
    );
}
