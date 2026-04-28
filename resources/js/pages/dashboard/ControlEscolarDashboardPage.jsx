import { useDashboardResumen } from './useDashboardResumen';
import { RoleDashboardTemplate } from './RoleDashboardTemplate';

export function ControlEscolarDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Control Escolar de la Escuela"
            subtitle="Captura, seguimiento y atencion de documentos academicos de la institucion."
            roleSummary={{
                label: 'Control Escolar Escuela',
                text: 'Gestiona captura academica, integra expediente y envia a revision institucional.',
            }}
            metrics={[
                { label: 'Borradores', value: r.borradores ?? 0 },
                { label: 'Devueltos con observaciones', value: r.rechazados ?? 0, tone: 'warning' },
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Expedientes incompletos', value: r.incompletos ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Importaciones recientes', value: r.importaciones ?? 0, subtitle: 'Informacion no disponible' },
            ]}
            quickActions={[
                { label: 'Nuevo documento academico', to: '/app/documentos/nuevo' },
                { label: 'Registrar alumno', to: '/app/alumnos/crear' },
                { label: 'Crear matricula', to: '/app/matriculas' },
                { label: 'Capturar materias/calificaciones', to: '/app/materias-cursadas' },
                { label: 'Capturar trayectoria', to: '/app/trayectorias' },
                { label: 'Importar calificaciones', to: '/app/importaciones' },
                { label: 'Consultar observados', to: '/app/documentos/bandejas/rechazados' },
            ]}
            priorities={[
                { label: 'Devueltos con observaciones', value: r.rechazados ?? 0 },
                { label: 'Documentos incompletos', value: r.incompletos ?? 0 },
                { label: 'Borradores pendientes de envio', value: r.borradores ?? 0 },
            ]}
            statusItems={[
                { label: 'Borradores', value: r.borradores ?? 0 },
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
            ]}
            modules={[
                { name: 'Expediente academico', description: 'Alumnos, matriculas, materias y trayectoria.', status: 'Operativo' },
                { name: 'Flujo documental', description: 'Wizard, validacion y envio a revision.', status: 'Operativo' },
                { name: 'Importaciones', description: 'Carga masiva academica.', status: 'Operativo con backend parcial' },
                { name: 'Firma real', description: 'No disponible en esta fase.', status: 'Pendiente' },
            ]}
            activities={[
                { label: 'Bandeja por rol', value: r.por_rol ?? (r.borradores ?? 0) + (r.en_revision ?? 0) },
                { label: 'Pendientes de atencion', value: (r.rechazados ?? 0) + (r.borradores ?? 0) },
            ]}
            emptyInsight="No existen documentos que requieran atencion en este momento."
        />
    );
}
