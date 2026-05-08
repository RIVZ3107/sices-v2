export function RoleDashboardCard({ title, value, description }) {
    return (
        <article className="inst-dashboard-card">
            <p className="inst-dashboard-card-title">{title}</p>
            <p className="inst-dashboard-card-value">{value ?? 0}</p>
            {description ? <p className="inst-dashboard-card-subtitle">{description}</p> : null}
        </article>
    );
}

