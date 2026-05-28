import { useDashboardResumen } from './useDashboardResumen';
import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function ResponsableCertificacionDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Certificación y Titulación"
            subtitle="Candidatos, folios, documentos oficiales y reportes de emisión. La ejecución técnica de firma/XML queda en Sistemas."
            roleSummary={{
                label: 'Certificación / titulación',
                text: 'Validación académica y documental hacia emisión oficial.',
            }}
            metrics={[
                { label: 'Pendientes de revisión', value: r.pendientes_revision ?? 0, tone: 'warning' },
                { label: 'Listos para proceso técnico', value: r.listos_para_firma ?? 0 },
                { label: 'Cancelados', value: r.cancelados ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0, tone: 'success' },
            ]}
            quickActions={[
                { label: 'Módulo certificación', to: '/app/certificacion/dashboard' },
                { label: 'Solicitudes', to: '/app/certificacion/solicitudes' },
                { label: 'Revisión institucional', to: '/app/certificacion/revision' },
                { label: 'Reportes', to: '/app/certificacion/reportes' },
            ]}
            priorities={[{ label: 'Pendientes', value: r.pendientes_revision ?? 0 }]}
            statusItems={[
                { label: 'Pendientes', value: r.pendientes_revision ?? 0 },
                { label: 'Listos firma', value: r.listos_para_firma ?? 0 },
            ]}
            modules={[{ name: 'Emisión', description: 'Flujo hacia documento oficial.', status: 'Operativo' }]}
            activities={[]}
            emptyInsight="Sin trámites pendientes de certificación en este momento."
        />
    );
}
