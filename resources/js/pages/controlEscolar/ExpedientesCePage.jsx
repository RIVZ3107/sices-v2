import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import {
    CE_ACTIVIDAD_RECIENTE,
    CE_DOCUMENTOS_REQUERIDOS,
    CE_DEMO_EXPEDIENTES,
} from '../../data/controlEscolarDemoData';

export function ExpedientesCePage() {
    const actions = [
        { to: '/app/expedientes', label: 'Crear expediente', variant: 'primary', icon: 'plus' },
        { to: '/app/documentos/bandejas/por-rol', label: 'Cargar documento', variant: 'success', icon: 'arrowUpTray' },
        { to: '/app/control-escolar/expedientes', label: 'Validar expediente operativo', variant: 'purple', icon: 'check' },
        { to: '/app/observaciones', label: 'Observar', variant: 'orange', icon: 'eye' },
    ];
    const metrics = [
        { title: 'Expedientes pendientes', value: '58', trend: '↑ 18% vs. ciclo anterior', tone: 'blue' },
        { title: 'Completos', value: '1,842', trend: '↓ 12% vs. ciclo anterior', tone: 'green' },
        { title: 'Con observaciones', value: '126', trend: '↑ 9% vs. ciclo anterior', tone: 'orange' },
        { title: 'Documentos faltantes', value: '312', trend: '↑ 14% vs. ciclo anterior', tone: 'purple' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Documentos requeridos">
                <ul className="space-y-2 text-sm">
                    {CE_DOCUMENTOS_REQUERIDOS.map((d) => (
                        <li key={d.nombre} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2">
                            <span className="text-slate-700">{d.nombre}</span>
                            <span className={d.ok ? 'text-emerald-600' : 'text-amber-600'}>{d.ok ? '✓' : '!'}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-slate-600">Promedio de documentos completos: 84%</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[84%] rounded-full bg-emerald-500" />
                </div>
            </CeInstSurface>
            <CeInstSurface title="Actividad reciente" className="mt-4">
                <ul className="ce-timeline text-sm">
                    {CE_ACTIVIDAD_RECIENTE.map((a, i) => (
                        <li key={i} className="ce-timeline-item">
                            <span className="font-medium text-slate-800">{a.texto}</span>
                            <span className="text-xs text-slate-500">{a.hora}</span>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Expedientes de alumnos"
            subtitle="Validación operativa y documentación; la validación normativa corresponde a Educación Superior."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <CeInstSurface title="Listado de expedientes">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input type="search" className="inst-input max-w-xs text-sm" placeholder="Buscar folio o alumno…" />
                    <button type="button" className="inst-btn inst-btn-secondary text-sm">
                        Filtros
                    </button>
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Última actualización</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_EXPEDIENTES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-semibold text-sky-700">
                                        <Link to="/app/expedientes">{r.folio}</Link>
                                    </td>
                                    <td className="px-2 py-2 text-slate-900">{r.alumno}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.programa}</td>
                                    <td className="px-2 py-2 text-xs text-slate-600">
                                        {r.actualizado}
                                        <div className="text-slate-500">{r.usuario}</div>
                                    </td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Ver</Link>
                                        {' · '}
                                        <Link to="/app/documentos/bandejas/por-rol">Subir</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={8} total={58} noun="expedientes" />
            </CeInstSurface>
        </CeShell>
    );
}
