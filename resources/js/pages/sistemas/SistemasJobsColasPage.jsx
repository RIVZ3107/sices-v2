import { CeInstSurface, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_JOBS_METRICAS, SIS_JOBS_TABLA } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasJobsColasPage() {
    const actions = [
        { to: '/app/sistemas/jobs-colas', label: 'Ejecutar tarea', variant: 'primary', icon: 'refreshCw' },
        { to: '/app/sistemas/jobs-colas', label: 'Reintentar fallidas', variant: 'orange', icon: 'refreshCw' },
        { to: '/app/sistemas/jobs-colas', label: 'Pausar cola', variant: 'muted', icon: 'clock' },
        { to: '/app/sistemas/jobs-colas', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
        { to: '/app/sistemas/jobs-colas', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];

    return (
        <CeShell
            title="Tareas programadas, colas y jobs"
            subtitle="Jobs reales del motor SICES (PDF, XML, firma, catálogos, correo, respaldo, índices)."
            actions={actions}
            metrics={SIS_JOBS_METRICAS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Salud de colas">
                        <ul className="space-y-2 text-xs text-slate-700">
                            <li className="flex justify-between">
                                certificados <CeStatusBadge>Activo</CeStatusBadge>
                            </li>
                            <li className="flex justify-between">
                                firma <CeStatusBadge>Observada</CeStatusBadge>
                            </li>
                            <li className="flex justify-between">
                                correos <CeStatusBadge>Activo</CeStatusBadge>
                            </li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Workers" className="mt-4">
                        <ul className="space-y-1 text-xs text-slate-600">
                            <li>worker-01 · General · heartbeat 09:41</li>
                            <li>worker-02 · Pesado · heartbeat 09:41</li>
                            <li>worker-03 · IO · heartbeat 09:40</li>
                        </ul>
                        <p className="mt-2 text-xs font-semibold text-slate-700">Capacidad 60%</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                            <div className="h-2 w-[60%] rounded-full bg-sky-600" />
                        </div>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Jobs">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Tarea</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Próxima ejecución</th>
                                <th className="px-2 py-2 text-left">Última ejecución</th>
                                <th className="px-2 py-2 text-left">Duración</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Cola</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_JOBS_TABLA.map((j) => (
                                <tr key={j.tarea} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{j.tarea}</td>
                                    <td className="px-2 py-2 text-slate-600">{j.tipo}</td>
                                    <td className="px-2 py-2 text-xs">{j.proxima}</td>
                                    <td className="px-2 py-2 text-xs">{j.ultima}</td>
                                    <td className="px-2 py-2 text-xs">{j.duracion}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{j.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 font-mono text-xs">{j.cola}</td>
                                    <td className="px-2 py-2 text-xs text-sky-700">⋯</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
            </CeInstSurface>
        </CeShell>
    );
}
