import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_INSCRIPCIONES, DE_FECHAS_INSCRIPCION, DE_INSCRIPCION_ETAPAS } from '../../data/direccionEscuelaDemoData';

export function DireccionInscripcionesPage() {
    const actions = [
        { to: '/app/direccion/inscripciones', label: 'Revisar inscripción', variant: 'primary', icon: 'eye' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Autorizar excepción', variant: 'success', icon: 'check' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Observar inscripción', variant: 'orange', icon: 'alertTriangle' },
        { to: '/app/expedientes', label: 'Ver expediente', variant: 'purple', icon: 'folder' },
        { to: '/app/direccion/reportes', label: 'Exportar', variant: 'muted', icon: 'arrowDownTray' },
        { to: '/app/direccion/inscripciones?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Inscripciones nuevas', value: '84', trend: '↑ 18% vs. ciclo anterior', tone: 'blue' },
        { title: 'Por validar', value: '57', trend: '↑ 12% vs. ciclo anterior', tone: 'green' },
        { title: 'Confirmadas', value: '312', trend: '↑ 24% vs. ciclo anterior', tone: 'green' },
        { title: 'Observadas', value: '23', trend: '↑ 15% vs. ciclo anterior', tone: 'orange' },
        { title: 'Documentos pendientes', value: '128', trend: '↓ 9% vs. ciclo anterior', tone: 'purple' },
        { title: 'Citas programadas', value: '96', trend: '↑ 14% vs. ciclo anterior', tone: 'orange' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Etapas del proceso de inscripción">
                <ol className="space-y-3 text-sm">
                    {DE_INSCRIPCION_ETAPAS.map((e) => (
                        <li
                            key={e.n}
                            className={`rounded-lg border p-3 ${
                                e.estado === 'completo'
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : e.estado === 'activo'
                                      ? 'border-sky-200 bg-sky-50'
                                      : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900">
                                    {e.n}. {e.titulo}
                                </span>
                                <span className="text-xs font-semibold text-slate-600">{e.count}</span>
                            </div>
                        </li>
                    ))}
                </ol>
                <Link to="/app/direccion/inscripciones" className="ce-link-more">
                    Ver detalle del proceso &gt;
                </Link>
            </CeInstSurface>
            <CeInstSurface title="Próximas fechas importantes" className="mt-4">
                <ul className="space-y-3 text-sm">
                    {DE_FECHAS_INSCRIPCION.map((f) => (
                        <li key={f.titulo} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                            <div>
                                <p className="font-bold text-slate-900">{f.fecha}</p>
                                <p className="text-slate-700">{f.titulo}</p>
                            </div>
                            <CeStatusBadge>{f.badge}</CeStatusBadge>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Supervisión de inscripciones"
            subtitle="Seguimiento y autorización institucional del proceso de ingreso (sin operación de captura ordinaria)."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <CeInstSurface title="Listado de inscripciones">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Total: 476 registros</span>
                    <input type="search" className="inst-input max-w-xs text-sm" placeholder="Buscar en la tabla…" />
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Responsable</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_INSCRIPCIONES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2">
                                        <Link to="/app/expedientes" className="font-semibold text-sky-700 hover:underline">
                                            {r.folio}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-2">
                                        <div className="font-medium text-slate-900">{r.alumno}</div>
                                        <div className="text-xs text-slate-500">{r.id}</div>
                                    </td>
                                    <td className="px-2 py-2 text-slate-700">{r.programa}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-slate-600">Dirección / Servicios escolares</td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Revisar</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={8} total={476} />
            </CeInstSurface>
        </CeShell>
    );
}
