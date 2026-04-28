import { useDashboardResumen } from '../dashboard/useDashboardResumen';
import { RoleDashboardTemplate } from '../dashboard/RoleDashboardTemplate';

export function ConsultaDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Consulta Documental"
            subtitle="Consulta autorizada de documentos academicos dentro del alcance asignado."
            roleSummary={{
                label: 'Consulta',
                text: 'Perfil de consulta sin acciones de modificacion o dictamen.',
            }}
            metrics={[
                { label: 'Documentos consultables', value: r.total_documentos ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Documentos aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Documentos firmados', value: r.firmados ?? 0 },
                { label: 'Documentos con incidencias', value: r.error_firma ?? 0, tone: 'warning' },
            ]}
            quickActions={[
                { label: 'Buscar documento', to: '/app/documentos/bandejas' },
                { label: 'Consultar expediente', to: '/app/documentos/bandejas/aprobados' },
                { label: 'Ver estado documental', to: '/app/documentos/bandejas/por-rol' },
            ]}
            priorities={[
                { label: 'Documentos aprobados', value: r.aprobados ?? 0 },
                { label: 'Documentos con incidencia', value: r.error_firma ?? 0 },
            ]}
            statusItems={[
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Firmados', value: r.firmados ?? 0 },
                { label: 'Incidencias', value: r.error_firma ?? 0 },
            ]}
            notices={[{ message: 'Perfil de consulta: no se habilitan acciones de editar, aprobar, rechazar o preparar firma.', type: 'info' }]}
            modules={[
                { name: 'Consulta documental', description: 'Busqueda y consulta por estado.', status: 'Operativo' },
                { name: 'Consulta de expediente', description: 'Detalle documental en solo lectura.', status: 'Operativo' },
            ]}
            activities={[]}
            emptyInsight="No hay registros para consulta en el alcance actual."
        />
    );
}
