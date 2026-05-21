import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_NOTIFICACIONES, ADM_NOTIFICACIONES_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

export function AdmisionNotificacionesPage() {
    const first = ADM_NOTIFICACIONES[0];
    return (
        <CeShell
            title="Notificaciones"
            subtitle="Gestiona y comunica información relevante a aspirantes y equipos."
            metrics={ADM_NOTIFICACIONES_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Detalle de la notificación">
                        <p className="text-xs text-slate-500">Destinatario</p>
                        <p className="text-sm font-medium text-slate-800">{first.destinatario}</p>
                        <p className="mt-2 text-xs text-slate-500">Asunto</p>
                        <p className="text-sm">{first.asunto}</p>
                        <p className="mt-2 text-xs text-slate-500">Canal</p>
                        <p className="text-sm">{first.canal}</p>
                        <p className="mt-2">
                            <CeStatusBadge>{first.estado}</CeStatusBadge>
                        </p>
                        <div className="mt-4 flex gap-2">
                            <button type="button" className="inst-btn inst-btn-primary px-3 py-1.5 text-xs">
                                Reenviar
                            </button>
                            <button type="button" className="inst-btn inst-btn-secondary px-3 py-1.5 text-xs">
                                Ver historial
                            </button>
                        </div>
                    </CeInstSurface>
                    <CeInstSurface title="Plantillas recientes" className="mt-4">
                        <ul className="space-y-2 text-xs text-slate-700">
                            <li>Confirmación de preinscripción · 15/05</li>
                            <li>Recordatorio: Examen de admisión · 12/05</li>
                        </ul>
                        <p className="mt-2 text-xs text-sky-700">Ver todas &gt;</p>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    Nueva notificación
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Plantillas
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Marcar leídas
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
            </div>
            <CeInstSurface title="Bandeja de notificaciones">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Destinatario</th>
                                <th className="px-2 py-2 text-left">Asunto</th>
                                <th className="px-2 py-2 text-left">Canal</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_NOTIFICACIONES.map((n) => (
                                <tr key={n.asunto} className="border-t border-slate-100">
                                    <td className="px-2 py-2">{n.tipo}</td>
                                    <td className="px-2 py-2 text-slate-600">{n.destinatario}</td>
                                    <td className="px-2 py-2">{n.asunto}</td>
                                    <td className="px-2 py-2">{n.canal}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{n.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{n.estado}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={3} total={86} noun="notificaciones" />
            </CeInstSurface>
        </CeShell>
    );
}
