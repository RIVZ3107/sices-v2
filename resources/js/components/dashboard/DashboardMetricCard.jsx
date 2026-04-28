import { StatCard } from '../ui/StatCard';

export function DashboardMetricCard({ title, value, tone = 'default', subtitle = '' }) {
    return <StatCard title={title} value={value ?? 0} tone={tone} subtitle={subtitle} />;
}
