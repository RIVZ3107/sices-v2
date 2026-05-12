import { Link } from 'react-router-dom';
import { useDashboardResumen } from '../dashboard/useDashboardResumen';
import { RoleDashboardTemplate } from '../dashboard/RoleDashboardTemplate';

export function AuditorDashboardPage() {
    const { resumen, error, extras } = useDashboardResumen();
    const r = resumen ?? {};
    const movimientos = Array.isArray(extras?.movimientos) ? extras.movimientos : [];
    const soloLectura = extras?.soloLectura === true;

    return (
        <div className="grid gap-4">
            <RoleDashboardTemplate
                resumen={resumen}
                error={error}
                title="Panel de auditoría y trazabilidad"
                subtitle="Consulta de eventos, cambios de estado y actividad institucional. Sin acciones de captura ni ajustes técnicos."
                roleSummary={{
                    label: 'Auditor',
                    text: 'Perfil de solo lectura para evidencia operativa y seguimiento documental.',
                }}
                metrics={[
                    { label: 'Documentos aprobados / emitidos', value: r.aprobados ?? 0 },
                    { label: 'En revisión', value: r.en_revision ?? 0 },
                    { label: 'Con observaciones', value: r.rechazados ?? 0 },
                    { label: 'Listos para proceso técnico', value: r.listos_para_firma ?? 0 },
                ]}
                quickActions={[
                    { label: 'Bandejas documentales', to: '/app/documentos/bandejas' },
                    { label: 'Reportes de lectura', to: '/app/admin/reportes-basicos' },
                ]}
                priorities={[
                    { label: 'Documentos en revisión', value: r.en_revision ?? 0 },
                    { label: 'Observaciones abiertas', value: r.rechazados ?? 0 },
                ]}
                statusItems={[
                    { label: 'En revisión', value: r.en_revision ?? 0 },
                    { label: 'Aprobados', value: r.aprobados ?? 0 },
                    { label: 'Devueltos', value: r.rechazados ?? 0 },
                    { label: 'Listos proceso técnico', value: r.listos_para_firma ?? 0 },
                ]}
                notices={[
                    {
                        message: soloLectura
                            ? 'Modo solo lectura: no se habilitan aprobaciones, rechazos ni captura académica.'
                            : 'Consulta de trazabilidad institucional.',
                        type: 'info',
                    },
                ]}
                modules={[
                    { name: 'Movimientos recientes', description: 'Eventos de auditoría registrados en el sistema.', status: 'Operativo' },
                    { name: 'Historial documental', description: 'Seguimiento de cambios de estado por documento.', status: 'Operativo' },
                ]}
                activities={[
                    { label: 'Documentos observados', value: r.rechazados ?? 0 },
                    { label: 'Documentos listos proceso técnico', value: r.listos_para_firma ?? 0 },
                ]}
                emptyInsight="Sin incidencias destacadas en el periodo actual."
            />
            {movimientos.length > 0 ? (
                <section className="inst-surface p-4 grid gap-2">
                    <h2 className="text-base font-semibold text-slate-900">Movimientos recientes</h2>
                    <ul className="divide-y divide-slate-100 text-sm">
                        {movimientos.map((m) => (
                            <li key={m.id} className="py-2 flex flex-wrap justify-between gap-2">
                                <span className="text-slate-800">{m.evento}</span>
                                <time className="text-slate-500 text-xs">{m.creado}</time>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/auditoria" className="inst-btn inst-btn-secondary text-sm w-fit">
                        Ver auditoría
                    </Link>
                </section>
            ) : null}
        </div>
    );
}
