import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function DocenteDashboardPage() {
    const resumen = {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error=""
            title="Panel Docente"
            subtitle="Modulo preparado para la futura captura academica por grupo, materia y periodo."
            roleSummary={{
                label: 'Docente',
                text: 'Modulo proyectado para crecimiento institucional del sistema.',
            }}
            metrics={[
                { label: 'Grupos asignados', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Captura de calificaciones', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Actas academicas', value: 0, subtitle: 'Modulo futuro' },
                { label: 'Historial academico', value: 0, subtitle: 'Modulo futuro' },
            ]}
            quickActions={[]}
            priorities={[]}
            statusItems={[]}
            notices={[{ message: 'Modulo en preparacion para expansion del sistema de control escolar. La certificacion actual opera con datos oficiales validados por Control Escolar.', type: 'info' }]}
            modules={[
                { name: 'Grupos asignados', description: 'Vista de grupos y materias por periodo.', status: 'En preparacion' },
                { name: 'Captura de calificaciones', description: 'Carga academica por grupo.', status: 'En preparacion' },
                { name: 'Actas academicas', description: 'Consolidacion de actas por ciclo.', status: 'En preparacion' },
            ]}
            activities={[]}
            emptyInsight="Modulo docente en preparacion, sin impacto en el flujo actual de certificacion."
        />
    );
}
