import { useDashboardResumen } from './useDashboardResumen';
import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function DirectorEscuelaDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Direccion Escolar"
            subtitle="Supervision institucional de documentos generados por la escuela."
            roleSummary={{
                label: 'Direccion Escolar',
                text: 'Da seguimiento institucional al flujo de revision y observaciones.',
            }}
            metrics={[
                { label: 'Documentos por enviar', value: r.por_enviar ?? 0 },
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Devueltos con observaciones', value: r.rechazados ?? 0, tone: 'warning' },
                { label: 'Pendientes validacion interna', value: r.pendientes_internos ?? 0, subtitle: 'Informacion no disponible' },
            ]}
            quickActions={[
                { label: 'Consultar documentos de la institucion', to: '/app/documentos/bandejas/por-rol' },
                { label: 'Revisar documentos por enviar', to: '/app/documentos/bandejas/por-enviar' },
                { label: 'Ver documentos observados', to: '/app/documentos/bandejas/rechazados' },
                { label: 'Ver documentos aprobados', to: '/app/documentos/bandejas/aprobados' },
            ]}
            priorities={[
                { label: 'Pendientes de envio', value: r.por_enviar ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
                { label: 'En revision', value: r.en_revision ?? 0 },
            ]}
            statusItems={[
                { label: 'Por enviar', value: r.por_enviar ?? 0 },
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
            ]}
            modules={[
                { name: 'Seguimiento institucional', description: 'Control de envio y revision.', status: 'Operativo' },
                { name: 'Bandejas de direccion', description: 'Por enviar, revision y aprobados.', status: 'Operativo' },
                { name: 'Integraciones tecnicas', description: 'No aplica a este rol.', status: 'No disponible' },
            ]}
            activities={[{ label: 'Documentos activos', value: (r.por_enviar ?? 0) + (r.en_revision ?? 0) }]}
            emptyInsight="No hay expedientes pendientes de validacion interna en este momento."
        />
    );
}
