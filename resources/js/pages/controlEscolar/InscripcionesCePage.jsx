import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_INSCRIPCIONES, CE_FECHAS_IMPORTANTES } from '../../data/controlEscolarDemoData';

export function InscripcionesCePage() {
    const actions = [
        { to: '/app/expedientes?tab=ingreso', label: 'Nueva inscripción', variant: 'primary', icon: 'plus' },
        { to: '/app/control-escolar/inscripciones', label: 'Validar documentos', variant: 'orange', icon: 'clipboardList' },
        { to: '/app/control-escolar/inscripciones', label: 'Confirmar inscripción', variant: 'success', icon: 'check' },
        { to: '/app/control-escolar/inscripciones', label: 'Imprimir comprobante', variant: 'purple', icon: 'printer' },
        { to: '/app/control-escolar/inscripciones?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Inscripciones nuevas', value: '58', trend: '↑ 8% vs. ciclo anterior', tone: 'blue' },
        { title: 'Por validar', value: '42', trend: '↑ 15% vs. ciclo anterior', tone: 'orange' },
        { title: 'Confirmadas', value: '196', trend: '↑ 12% vs. ciclo anterior', tone: 'green' },
        { title: 'Observadas', value: '16', trend: '↑ 6% vs. ciclo anterior', tone: 'purple' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Pasos del proceso de inscripción">
                <ol className="space-y-3 text-sm">
                    <li className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                        <span className="font-bold text-sky-800">1.</span> Registro de datos — captura del aspirante.
                    </li>
                    <li className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <span className="font-bold text-amber-900">2.</span> Carga de documentos requeridos.
                    </li>
                    <li className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <span className="font-bold text-violet-900">3.</span> Validación operativa de expediente.
                    </li>
                    <li className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <span className="font-bold text-emerald-900">4.</span> Confirmación (solo si ya existe matrícula asignada por Educación Superior).
                    </li>
                </ol>
            </CeInstSurface>
            <CeInstSurface title="Próximas fechas importantes" className="mt-4">
                <ul className="space-y-3 text-sm">
                    {CE_FECHAS_IMPORTANTES.map((f) => (
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
            title="Control de inscripciones"
            subtitle="Educación Normal y UPN. La confirmación final requiere matrícula asignada por Educación Superior."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Regla: solo se puede <strong>confirmar inscripción</strong> cuando el alumno ya tiene <strong>matrícula asignada</strong> por Educación Superior.
            </div>
            <CeInstSurface title="Inscripciones">
                <div className="mb-3 flex flex-wrap gap-2">
                    <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar en la tabla…" />
                    <span className="text-xs text-slate-600">10 por página</span>
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
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_INSCRIPCIONES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2">
                                        <Link to="/app/expedientes" className="font-semibold text-sky-700">
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
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Revisar</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={10} total={312} noun="resultados" />
            </CeInstSurface>
        </CeShell>
    );
}
