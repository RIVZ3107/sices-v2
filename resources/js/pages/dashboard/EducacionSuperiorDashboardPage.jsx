import { useDashboardResumen } from './useDashboardResumen';
import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function EducacionSuperiorDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Revision Institucional"
            subtitle="Revision, validacion y dictamen de documentos academicos enviados por las instituciones."
            roleSummary={{
                label: 'Educacion Superior',
                text: 'Analiza expedientes, emite observaciones y dictamina aprobacion documental.',
            }}
            metrics={[
                { label: 'Pendientes de revision', value: r.pendientes_revision ?? 0 },
                { label: 'Documentos con observaciones', value: r.rechazados ?? 0, tone: 'warning' },
                { label: 'Documentos aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Documentos devueltos', value: r.rechazados ?? 0 },
                { label: 'Preparados para firma', value: r.listos_para_firma ?? 0 },
                { label: 'Errores bloqueantes', value: r.errores_bloqueantes ?? 0, subtitle: 'Informacion no disponible' },
            ]}
            quickActions={[
                { label: 'Revisar pendientes', to: '/app/documentos/bandejas/pendientes-revision' },
                { label: 'Ver observados', to: '/app/documentos/bandejas/rechazados' },
                { label: 'Validar expediente academico', to: '/app/documentos/validacion' },
                { label: 'Consultar aprobados', to: '/app/documentos/bandejas/aprobados' },
                { label: 'Preparar documento para firma', to: '/app/documentos/bandejas/listos-para-firma' },
                { label: 'Historial de revision', to: '/app/documentos/observaciones' },
            ]}
            priorities={[
                { label: 'Pendientes de dictamen', value: r.pendientes_revision ?? 0 },
                { label: 'Observaciones pendientes', value: r.rechazados ?? 0 },
                { label: 'Listos para dictamen', value: r.en_revision ?? 0 },
            ]}
            statusItems={[
                { label: 'Pendientes', value: r.pendientes_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
                { label: 'Listos firma', value: r.listos_para_firma ?? 0 },
            ]}
            modules={[
                { name: 'Revision y dictamen', description: 'Analisis integral documental.', status: 'Operativo' },
                { name: 'Validacion academica', description: 'Control de consistencia por secciones.', status: 'Operativo' },
                { name: 'Firma real', description: 'No disponible para este rol.', status: 'Pendiente' },
            ]}
            activities={[{ label: 'Expedientes en revision', value: r.en_revision ?? 0 }]}
            emptyInsight="No hay expedientes pendientes de dictamen en este momento."
        />
    );
}
