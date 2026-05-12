import { useDashboardResumen } from './useDashboardResumen';
import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function ResponsableAdmisionDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Admisión"
            subtitle="Seguimiento de aspirantes, documentos de ingreso y estados de admisión."
            roleSummary={{
                label: 'Responsable de admisión',
                text: 'Coordina convocatorias, validación de requisitos y comunicación con aspirantes.',
            }}
            metrics={[
                { label: 'Expedientes / bandeja', value: r.expedientes ?? 0 },
                { label: 'Documentos aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Pendientes de revisión', value: r.pendientes_revision ?? 0, tone: 'warning' },
                { label: 'Observaciones', value: r.rechazados ?? 0 },
            ]}
            quickActions={[
                { label: 'Aspirantes y expedientes', to: '/app/expedientes' },
                { label: 'Observaciones', to: '/app/observaciones' },
            ]}
            priorities={[
                { label: 'Pendientes', value: r.pendientes_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
            ]}
            statusItems={[
                { label: 'Borradores', value: r.borradores ?? 0 },
                { label: 'Pendientes', value: r.pendientes_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
            ]}
            modules={[
                { name: 'Admisión', description: 'Flujo de ingreso y validación documental.', status: 'Operativo' },
            ]}
            activities={[]}
            emptyInsight="Sin actividad destacada en este periodo."
        />
    );
}
