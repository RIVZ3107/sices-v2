import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';

export function CatalogosPage() {
    return (
        <DashboardShell>
            <DashboardHeader title="Catalogos institucionales" subtitle="Consulta y gobierno de catalogos maestros del sistema." />
            <DashboardInstitutionalNotice type="info" message="Catalogos administrativos en preparacion. Se habilitaran con endpoints de gestion dedicados." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard title="Catalogos activos" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Catalogos pendientes" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Ultima actualizacion" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Version catalogos" value={0} subtitle="Informacion no disponible" />
            </div>
            <DashboardQuickActions
                title="Navegacion rapida"
                actions={[
                    { label: 'Dashboard admin', to: '/app/admin/dashboard' },
                    { label: 'Usuarios y roles', to: '/app/admin/usuarios-roles' },
                    { label: 'Reportes basicos', to: '/app/admin/reportes-basicos' },
                    { label: 'Parametros', to: '/app/admin/parametros' },
                ]}
            />
            <DashboardStatusOverview
                title="Estado de catalogos"
                items={[
                    { label: 'Institucionales', value: 'Operativo parcial' },
                    { label: 'Academicos', value: 'Operativo parcial' },
                    { label: 'Administrativos', value: 'Pendiente backend' },
                ]}
            />
            <DashboardModuleGrid
                title="Funciones previstas"
                modules={[
                    { name: 'Versionado de catalogos', description: 'Control de versiones y vigencias.', status: 'Pendiente backend' },
                    { name: 'Publicacion controlada', description: 'Flujo de cambios con validacion.', status: 'Pendiente backend' },
                    { name: 'Trazabilidad de modificaciones', description: 'Bitacora institucional de cambios.', status: 'Pendiente backend' },
                    { name: 'Dependencias academicas', description: 'Validacion de consistencia entre catalogos.', status: 'Pendiente backend' },
                ]}
            />
        </DashboardShell>
    );
}
