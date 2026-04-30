import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';
import { ModuleHeader } from '../../components/ui/ModuleHeader';

export function ParametrosSistemaPage() {
    return (
        <DashboardShell>
            <ModuleHeader title="Parámetros del sistema" subtitle="Configuración de políticas y valores institucionales." />
            <DashboardInstitutionalNotice type="warning" message="Edicion de parametros en preparacion. Esta seccion no afecta la operacion actual del flujo documental." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard title="Parametros operativos" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Parametros de seguridad" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Cambios recientes" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Version de configuracion" value={0} subtitle="Informacion no disponible" />
            </div>
            <DashboardQuickActions
                title="Navegacion administrativa"
                actions={[
                    { label: 'Dashboard admin', to: '/app/admin/dashboard' },
                    { label: 'Usuarios y roles', to: '/app/admin/usuarios-roles' },
                    { label: 'Catalogos', to: '/app/admin/catalogos' },
                    { label: 'Reportes basicos', to: '/app/admin/reportes-basicos' },
                ]}
            />
            <DashboardStatusOverview
                title="Estado de parametrizacion"
                items={[
                    { label: 'Politicas academicas', value: 'Preparacion' },
                    { label: 'Reglas operativas', value: 'Preparacion' },
                    { label: 'Controles institucionales', value: 'Preparacion' },
                ]}
            />
            <DashboardModuleGrid
                title="Funciones previstas"
                modules={[
                    { name: 'Politicas de operacion', description: 'Ajustes de flujo institucional.', status: 'Pendiente backend' },
                    { name: 'Reglas de validacion', description: 'Parametros de consistencia operativa.', status: 'Pendiente backend' },
                    { name: 'Control de versiones', description: 'Versionado de configuraciones.', status: 'Pendiente backend' },
                    { name: 'Historial de cambios', description: 'Trazabilidad de ajustes administrativos.', status: 'Pendiente backend' },
                ]}
            />
        </DashboardShell>
    );
}
