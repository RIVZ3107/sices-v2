import { RoleDashboardTemplate } from '../dashboard/RoleDashboardTemplate';
import { useDashboardResumen } from '../dashboard/useDashboardResumen';

export function AdminDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel Administrativo"
            subtitle="Supervision operativa de documentos academicos, usuarios, catalogos e importaciones."
            roleSummary={{
                label: 'Admin',
                text: 'Coordina operacion documental y gestion institucional de apoyo.',
            }}
            metrics={[
                { label: 'Documentos en proceso', value: (r.borradores ?? 0) + (r.en_revision ?? 0) },
                { label: 'Pendientes de revision', value: r.pendientes_revision ?? 0 },
                { label: 'Documentos observados', value: r.rechazados ?? 0, tone: 'warning' },
                { label: 'Aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Importaciones academicas', value: r.importaciones ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Preparados para firma', value: r.listos_para_firma ?? 0 },
            ]}
            quickActions={[
                { label: 'Bandejas generales', to: '/app/documentos/bandejas' },
                { label: 'Documentos aprobados', to: '/app/documentos/bandejas/aprobados' },
                { label: 'Documentos devueltos', to: '/app/documentos/bandejas/rechazados' },
                { label: 'Listos para firma', to: '/app/sistemas/listos-para-firma' },
                { label: 'Alumnos', to: '/app/alumnos' },
                { label: 'Matriculas', to: '/app/matriculas' },
                { label: 'Materias / calificaciones', to: '/app/materias-cursadas' },
                { label: 'Trayectorias', to: '/app/trayectorias' },
                { label: 'Importaciones', to: '/app/importaciones' },
                { label: 'Usuarios operativos', to: '/app/admin/usuarios-roles' },
                { label: 'Reportes basicos', to: '/app/admin/reportes-basicos' },
            ]}
            priorities={[
                { label: 'Pendientes revision', value: r.pendientes_revision ?? 0 },
                { label: 'Observados', value: r.rechazados ?? 0 },
                { label: 'Listos para firma', value: r.listos_para_firma ?? 0 },
            ]}
            statusItems={[
                { label: 'En proceso', value: (r.borradores ?? 0) + (r.en_revision ?? 0) },
                { label: 'Pendientes', value: r.pendientes_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Observados', value: r.rechazados ?? 0 },
            ]}
            modules={[
                { name: 'Operacion documental', description: 'Seguimiento por bandejas y estados.', status: 'Operativo' },
                { name: 'Gestion academica', description: 'Alumnos, matriculas, materias, trayectoria e importaciones.', status: 'Operativo parcial' },
                { name: 'Reportes institucionales', description: 'Reporte por ciclo escolar, institucion, estado documental, observaciones y preparacion para firma.', status: 'Pendiente de conexion con servicios de consulta agregada' },
            ]}
            activities={[{ label: 'Incidencias tecnicas', value: r.error_firma ?? 0 }]}
            emptyInsight="El modulo administrativo mantendra indicadores en cero hasta recibir datos agregados complementarios."
        />
    );
}
