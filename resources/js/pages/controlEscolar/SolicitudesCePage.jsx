import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_COMENTARIOS_SOL, CE_DEMO_SOLICITUDES, CE_TIPOS_SOLICITUD } from '../../data/controlEscolarDemoData';

export function SolicitudesCePage() {
    const actions = [
        { to: '/app/control-escolar/solicitudes', label: 'Nueva solicitud', variant: 'primary', icon: 'plus' },
        { to: '/app/control-escolar/solicitudes', label: 'Revisar', variant: 'muted', icon: 'eye' },
        { to: '/app/control-escolar/solicitudes', label: 'Enviar', variant: 'success', icon: 'send' },
        { to: '/app/observaciones', label: 'Atender observación', variant: 'orange', icon: 'envelope' },
        { to: '/app/control-escolar/solicitudes?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Pendientes', value: '58', trend: '↓ 12% vs. ciclo anterior', tone: 'blue' },
        { title: 'Urgentes', value: '7', trend: '↑ 75% vs. ciclo anterior', tone: 'red' },
        { title: 'En revisión', value: '16', trend: '↑ 14% vs. ciclo anterior', tone: 'orange' },
        { title: 'Resueltas', value: '124', trend: '↓ 8% vs. ciclo anterior', tone: 'green' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Tipos de solicitud">
                <ul className="space-y-2 text-sm">
                    {CE_TIPOS_SOLICITUD.map((t) => (
                        <li key={t.tipo} className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-slate-700">{t.tipo}</span>
                            <span className="font-bold text-slate-900">{t.n}</span>
                        </li>
                    ))}
                </ul>
                <Link to="/app/control-escolar/solicitudes" className="ce-link-more mt-2 inline-block">
                    Ver todos los tipos &gt;
                </Link>
            </CeInstSurface>
            <CeInstSurface title="Comentarios recientes" className="mt-4">
                <ul className="space-y-3 text-sm">
                    {CE_DEMO_COMENTARIOS_SOL.map((c, i) => (
                        <li key={i} className="border-b border-slate-100 pb-3">
                            <p className="font-semibold text-slate-900">{c.autor}</p>
                            <p className="text-xs text-slate-500">
                                {c.folio} · {c.hora}
                            </p>
                            <p className="mt-1 text-slate-700">{c.texto}</p>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Solicitudes y trámites"
            subtitle="Administra y da seguimiento a solicitudes operativas. La aprobación oficial de matrícula la realiza Educación Superior."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Desde aquí se canalizan trámites de constancias, cambios y revisiones. Use la bandeja de{' '}
                <Link to="/app/solicitudes-matricula" className="font-semibold text-sky-800 hover:underline">
                    solicitudes de matrícula
                </Link>{' '}
                para el flujo específico hacia Educación Superior.
            </div>
            <CeInstSurface title="Todas las solicitudes">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left w-8"> </th>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Prioridad</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_SOLICITUDES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2">
                                        <input type="checkbox" className="rounded border-slate-300" aria-label="Seleccionar" />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Link to="/app/expedientes" className="font-semibold text-sky-700">
                                            {r.folio}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-2">{r.tipo}</td>
                                    <td className="px-2 py-2 text-slate-800">{r.alumno}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.prioridad}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={10} total={58} />
            </CeInstSurface>
        </CeShell>
    );
}
