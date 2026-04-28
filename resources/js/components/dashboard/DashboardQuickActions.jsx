import { Link } from 'react-router-dom';

export function DashboardQuickActions({ title = 'Acciones rapidas', actions = [] }) {
    return (
        <article className="inst-surface p-4">
            <h3 className="inst-title text-sm">{title}</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
                {actions.map((action) => (
                    <Link key={action.to} to={action.to} className="inst-btn inst-btn-secondary text-sm text-center">
                        {action.label}
                    </Link>
                ))}
            </div>
        </article>
    );
}
