import { useDashboardResumen } from '../dashboard/useDashboardResumen';
import { RoleDashboardTemplate } from '../dashboard/RoleDashboardTemplate';

export function SuperAdminDashboardPage() {
    const { resumen, error } = useDashboardResumen();
    const r = resumen ?? {};

    return (
        <RoleDashboardTemplate
            resumen={resumen}
            error={error}
            title="Panel de Administracion Institucional"
            subtitle="Seguimiento integral de operacion academica, revision documental, trazabilidad y configuracion del sistema."
            roleSummary={{
                label: 'Superadmin',
                text: 'Vision global de operacion, gobierno institucional y trazabilidad.',
            }}
            metrics={[
                { label: 'Total documentos academicos', value: r.total_documentos ?? ((r.borradores ?? 0) + (r.en_revision ?? 0) + (r.aprobados ?? 0)) },
                { label: 'Pendientes de revision', value: r.pendientes_revision ?? 0 },
                { label: 'Observados/devueltos', value: r.rechazados ?? 0, tone: 'warning' },
                { label: 'Aprobados', value: r.aprobados ?? 0, tone: 'success' },
                { label: 'Preparados para firma', value: r.listos_para_firma ?? 0 },
                { label: 'Incidencias tecnicas', value: r.error_firma ?? 0, tone: 'danger' },
                { label: 'Usuarios registrados', value: r.usuarios ?? 0, subtitle: 'Informacion no disponible' },
                { label: 'Instituciones configuradas', value: r.instituciones ?? 0, subtitle: 'Informacion no disponible' },
            ]}
            quickActions={[
                { label: 'Consultar bandejas', to: '/app/documentos/bandejas' },
                { label: 'Ver documentos academicos', to: '/app/documentos/bandejas/por-rol' },
                { label: 'Revisar observaciones', to: '/app/documentos/observaciones' },
                { label: 'Validacion academica', to: '/app/documentos/validacion' },
                { label: 'Importaciones academicas', to: '/app/importaciones' },
                { label: 'Usuarios y roles', to: '/app/admin/usuarios-roles' },
                { label: 'Catalogos institucionales', to: '/app/admin/catalogos' },
                { label: 'Parametros del sistema', to: '/app/admin/parametros' },
                { label: 'Auditoria', to: '/app/auditoria' },
                { label: 'Reportes basicos', to: '/app/admin/reportes-basicos' },
            ]}
            priorities={[
                { label: 'Borradores', value: r.borradores ?? 0 },
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
                { label: 'Incidencias tecnicas', value: r.error_firma ?? 0 },
            ]}
            statusItems={[
                { label: 'Borradores', value: r.borradores ?? 0 },
                { label: 'En revision', value: r.en_revision ?? 0 },
                { label: 'Aprobados', value: r.aprobados ?? 0 },
                { label: 'Devueltos', value: r.rechazados ?? 0 },
                { label: 'Preparados firma', value: r.listos_para_firma ?? 0 },
                { label: 'Firmados', value: r.firmados ?? 0 },
            ]}
            notices={[
                { message: 'Firma real SEP/since-service pendiente de activacion controlada.', type: 'warning' },
                { message: 'Generacion PDF/Jasper oficial pendiente de activacion en fase posterior.', type: 'info' },
            ]}
            modules={[
                { name: 'Seguimiento documental', description: 'Control integral por estado de flujo.', status: 'Operativo' },
                { name: 'Operacion institucional', description: 'Bandejas, observaciones y validacion.', status: 'Operativo' },
                { name: 'Administracion del sistema', description: 'Usuarios, catalogos, parametros, auditoria.', status: 'Operativo parcial' },
                { name: 'Servicios administrativos agregados', description: 'Informacion pendiente de conexion con servicios administrativos.', status: 'Pendiente backend' },
            ]}
            activities={[
                { label: 'Documentos en proceso', value: (r.borradores ?? 0) + (r.en_revision ?? 0) },
                { label: 'Pendientes tecnicos', value: r.pendientes_tecnicos ?? 0 },
            ]}
            emptyInsight="En ausencia de datos agregados administrativos, el panel mantiene operacion documental activa y trazable."
        />
    );
}
