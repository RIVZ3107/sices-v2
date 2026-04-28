import { useDashboardResumen } from '../dashboard/useDashboardResumen';
import { RoleDashboardTemplate } from '../dashboard/RoleDashboardTemplate';

export function AuditorDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Auditoria y Trazabilidad"
            subtitle="Consulta de eventos, cambios de estado, observaciones y actividad institucional."
            roleSummary={{
                label: 'Auditor',
                text: 'Perfil de solo lectura para trazabilidad y evidencia operativa.',
            }}
            metrics={[
                { label: 'Eventos registrados', value: r.eventos ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Cambios de estado', value: r.cambios_estado ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Observaciones registradas', value: r.rechazados ?? 0 },
                { label: 'Documentos consultados', value: r.total_documentos ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Incidencias tecnicas', value: r.error_firma ?? 0 },
                { label: 'Usuarios con actividad', value: r.usuarios_actividad ?? 0, subtitle: 'Informacion no disponible' },
            ]}
            quickActions={[
                { label: 'Bandejas documentales', to: '/app/documentos/bandejas' },
                { label: 'Logs tecnicos', to: '/app/sistemas/logs' },
            ]}
            priorities={[
                { label: 'Documentos en revision', value: r.en_revision ?? 0 },
                { label: 'Observaciones abiertas', value: r.rechazados ?? 0 },
                { label: 'Incidencias tecnicas', value: r.error_firma ?? 0 },
            ]}
            statusItems={[
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
                { label: 'Listos firma', value: r.listos_para_firma ?? 0 },
            ]}
            notices={[{ message: 'Perfil de auditoria en modo solo lectura. No se habilitan acciones de captura, aprobacion o rechazo.', type: 'info' }]}
            modules={[
                { name: 'Eventos recientes', description: 'Trazabilidad de eventos por documento.', status: 'Pendiente backend agregado' },
                { name: 'Historial documental', description: 'Seguimiento de cambios de estado.', status: 'Pendiente backend agregado' },
                { name: 'Actividad por modulo', description: 'Analitica institucional de uso.', status: 'Pendiente backend agregado' },
            ]}
            activities={[
                { label: 'Documentos observados', value: r.rechazados ?? 0 },
                { label: 'Documentos listos firma', value: r.listos_para_firma ?? 0 },
            ]}
            emptyInsight="Los modulos de auditoria detallada estan en preparacion y no afectan la operacion actual."
        />
    );
}
