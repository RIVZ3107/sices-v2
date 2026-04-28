import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';

export function ReportesBasicosPage() {
    return (
        <DashboardShell>
            <DashboardHeader title="Reportes institucionales" subtitle="Indicadores operativos y exportables para seguimiento del proceso de certificacion." />
            <DashboardInstitutionalNotice type="info" message="Estado: pendiente de conexion con servicios de consulta agregada." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard title="Reportes por ciclo" value={0} subtitle="Pendiente backend" />
                <DashboardMetricCard title="Reportes por institucion" value={0} subtitle="Pendiente backend" />
                <DashboardMetricCard title="Reportes por estado documental" value={0} subtitle="Pendiente backend" />
                <DashboardMetricCard title="Reportes de observaciones" value={0} subtitle="Pendiente backend" />
            </div>
            <DashboardQuickActions
                title="Navegacion administrativa"
                actions={[
                    { label: 'Dashboard admin', to: '/app/admin/dashboard' },
                    { label: 'Catalogos', to: '/app/admin/catalogos' },
                    { label: 'Usuarios y roles', to: '/app/admin/usuarios-roles' },
                    { label: 'Parametros', to: '/app/admin/parametros' },
                ]}
            />
            <DashboardStatusOverview
                title="Seguimiento de reportes"
                items={[
                    { label: 'Diseno de reportes', value: 'Preparacion' },
                    { label: 'Datos agregados', value: 'Pendiente backend' },
                    { label: 'Exportacion administrativa', value: 'Pendiente backend' },
                ]}
            />
            <DashboardModuleGrid
                title="Funciones previstas"
                modules={[
                    { name: 'Reporte por ciclo escolar', description: 'Concentrado por periodo academico.', status: 'Pendiente backend' },
                    { name: 'Reporte por institucion', description: 'Comparativo institucional.', status: 'Pendiente backend' },
                    { name: 'Reporte por estado documental', description: 'Seguimiento del workflow.', status: 'Pendiente backend' },
                    { name: 'Reporte de observaciones', description: 'Analitica de devoluciones y atencion.', status: 'Pendiente backend' },
                    { name: 'Exportacion administrativa', description: 'Salida de informacion consolidada.', status: 'Pendiente backend' },
                ]}
            />
        </DashboardShell>
    );
}
