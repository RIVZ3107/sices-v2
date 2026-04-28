import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function CoordinadorAcademicoDashboardPage() {
    const resumen = {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error=""
            title="Panel de Coordinacion Academica"
            subtitle="Modulo preparado para seguimiento de programas, planes de estudio, materias y revision academica."
            roleSummary={{
                label: 'Coordinador academico',
                text: 'Seguimiento academico institucional en fase de crecimiento funcional.',
            }}
            metrics={[
                { label: 'Programas academicos', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Planes de estudio', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Materias', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Grupos', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Revision academica', value: 0, subtitle: 'Modulo futuro' },
            ]}
            quickActions={[]}
            priorities={[]}
            statusItems={[]}
            notices={[{ message: 'Modulo preparado para crecimiento academico institucional. Sera habilitado en una fase posterior.', type: 'info' }]}
            modules={[
                { name: 'Programas academicos', description: 'Gestion curricular por institucion.', status: 'Pendiente backend' },
                { name: 'Planes de estudio', description: 'Versionado y estructura de plan.', status: 'Pendiente backend' },
                { name: 'Revision academica', description: 'Supervision de consistencia curricular.', status: 'Pendiente backend' },
            ]}
            activities={[]}
            emptyInsight="Modulo en preparacion, sin impacto en la operacion vigente de certificacion."
        />
    );
}
