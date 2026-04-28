import { PageHeader } from '../PageHeader';

export function DashboardHeader({ title, subtitle, actions = null }) {
    return <PageHeader title={title} subtitle={subtitle} actions={actions} />;
}
