export function ModuleHeader({ title, subtitle, actions = null }) {
    return (
        <header className="inst-dashboard-panel mb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="inst-title text-lg">{title}</h2>
                    {subtitle ? <p className="inst-muted mt-1 text-sm">{subtitle}</p> : null}
                </div>
                {actions}
            </div>
        </header>
    );
}
