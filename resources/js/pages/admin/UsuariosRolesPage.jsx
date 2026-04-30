import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DataTableWrapper } from '../../components/ui/DataTableWrapper';
import { ModuleHeader } from '../../components/ui/ModuleHeader';
import { RoleBadge } from '../../components/ui/RoleBadge';

export function UsuariosRolesPage() {
    return (
        <DashboardShell>
            <ModuleHeader
                title="Usuarios y roles"
                subtitle="Administración institucional de accesos, roles y permisos operativos."
                actions={<button className="inst-btn inst-btn-primary text-sm">Nuevo usuario</button>}
            />
            <DashboardInstitutionalNotice type="info" message="Modulo administrativo preparado. Su operacion completa depende de endpoints de gestion de usuarios." />
            <div className="inst-dashboard-grid-metrics">
                <DashboardMetricCard title="Usuarios activos" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Roles configurados" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Permisos asignados" value={0} subtitle="Informacion no disponible" />
                <DashboardMetricCard title="Altas pendientes" value={0} subtitle="Informacion no disponible" />
            </div>
            <DataTableWrapper
                title="Gestión de usuarios"
                toolbar={(
                    <div className="flex gap-2">
                        <input className="inst-input w-44 text-sm" placeholder="Buscar usuario..." />
                        <select className="inst-select w-40 text-sm">
                            <option>Filtrar por rol</option>
                        </select>
                    </div>
                )}
            >
                <table className="inst-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-sm font-semibold">Pendiente de integración</td>
                            <td className="text-sm inst-muted">Endpoint de listado no disponible</td>
                            <td><RoleBadge role="admin" /></td>
                            <td><span className="inst-badge inst-badge-warning">Preparación</span></td>
                            <td className="text-sm inst-muted">Sin acciones</td>
                        </tr>
                    </tbody>
                </table>
            </DataTableWrapper>
        </DashboardShell>
    );
}
