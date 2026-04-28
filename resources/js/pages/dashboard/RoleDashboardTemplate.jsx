import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { DashboardActivityPanel } from '../../components/dashboard/DashboardActivityPanel';
import { DashboardEmptyInsight } from '../../components/dashboard/DashboardEmptyInsight';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardPriorityPanel } from '../../components/dashboard/DashboardPriorityPanel';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardRoleSummary } from '../../components/dashboard/DashboardRoleSummary';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';

export function RoleDashboardTemplate({
    resumen,
    error,
    title,
    subtitle,
    roleSummary,
    metrics = [],
    quickActions = [],
    priorities = [],
    statusItems = [],
    notices = [],
    modules = [],
    activities = [],
    emptyInsight = '',
}) {
    if (resumen === null) return <LoadingState text="Cargando panel de mando..." />;

    return (
        <DashboardShell>
            <DashboardHeader title={title} subtitle={subtitle} />
            {error ? <ErrorState message={error} /> : null}
            {notices.map((notice) => (
                <DashboardInstitutionalNotice key={notice.message} message={notice.message} type={notice.type} />
            ))}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((m) => <DashboardMetricCard key={m.label} title={m.label} value={m.value} tone={m.tone} subtitle={m.subtitle} />)}
            </div>
            <DashboardRoleSummary roleLabel={roleSummary.label} text={roleSummary.text} />
            <div className="grid gap-4 lg:grid-cols-2">
                <DashboardQuickActions actions={quickActions} />
                <DashboardPriorityPanel items={priorities} emptyMessage="No existen documentos que requieran atencion en este momento." />
            </div>
            <DashboardStatusOverview items={statusItems} />
            <div className="grid gap-4 lg:grid-cols-2">
                <DashboardModuleGrid modules={modules} />
                <DashboardActivityPanel activities={activities} />
            </div>
            <DashboardEmptyInsight description={emptyInsight} />
        </DashboardShell>
    );
}
