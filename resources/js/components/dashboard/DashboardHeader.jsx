export function DashboardHeader({ title, subtitle, actions = null }) {
    return (
        <header className="inst-dashboard-panel">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="inst-dashboard-title">{title}</h1>
                    <p className="inst-dashboard-subtitle">{subtitle}</p>
                </div>
                {actions}
            </div>
        </header>
    );
}
