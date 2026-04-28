import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';

export function UsuariosRolesPage() {
    return (
        <DashboardShell>
            <DashboardHeader title="Usuarios y roles" subtitle="Administracion institucional de acceso, perfiles y permisos por rol." />
            <DashboardInstitutionalNotice type="info" message="Modulo administrativo preparado. Su operacion completa depende de endpoints de gestion de usuarios." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard title="Usuarios activos" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Roles configurados" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Permisos asignados" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Altas pendientes" value={0} subtitle="Informacion no disponible" />
            </div>
            <DashboardQuickActions
                title="Navegacion administrativa"
                actions={[
                    { label: 'Dashboard admin', to: '/app/admin/dashboard' },
                    { label: 'Catalogos', to: '/app/admin/catalogos' },
                    { label: 'Parametros', to: '/app/admin/parametros' },
                    { label: 'Auditoria', to: '/app/auditoria' },
                ]}
            />
            <DashboardStatusOverview
                title="Estado operativo"
                items={[
                    { label: 'Gestion de usuarios', value: 'Preparacion' },
                    { label: 'Asignacion de roles', value: 'Preparacion' },
                    { label: 'Control de permisos', value: 'Preparacion' },
                ]}
            />
            <DashboardModuleGrid
                title="Funciones previstas"
                modules={[
                    { name: 'Alta y baja de usuarios', description: 'Ciclo de vida de usuarios institucionales.', status: 'Pendiente backend' },
                    { name: 'Asignacion de rol principal', description: 'Gobierno de roles por perfil operativo.', status: 'Pendiente backend' },
                    { name: 'Matriz de permisos', description: 'Visualizacion y ajuste de permisos por rol.', status: 'Pendiente backend' },
                    { name: 'Bitacora de cambios', description: 'Trazabilidad de cambios de acceso.', status: 'Pendiente backend' },
                ]}
            />
        </DashboardShell>
    );
}
