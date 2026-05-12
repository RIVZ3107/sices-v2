import { useDashboardResumen } from './useDashboardResumen';
import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function ResponsableEvaluacionDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Evaluación"
            subtitle="Periodos de captura, calificaciones, actas y regularización."
            roleSummary={{
                label: 'Responsable de evaluación',
                text: 'Supervisa grupos, captura y cierre de calificaciones sin duplicar vistas por subsistema.',
            }}
            metrics={[
                { label: 'En revisión', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
            ]}
            quickActions={[
                { label: 'Panel de coordinación', to: '/app/coordinador/dashboard' },
            ]}
            priorities={[{ label: 'En revisión', value: r.en_revision ?? 0 }]}
            statusItems={[
                { label: 'En revisión', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
            ]}
            modules={[{ name: 'Evaluación', description: 'Seguimiento académico.', status: 'Operativo' }]}
            activities={[]}
            emptyInsight="Sin incidencias de evaluación registradas."
        />
    );
}
