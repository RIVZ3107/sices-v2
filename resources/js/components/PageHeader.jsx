export function PageHeader({ title, subtitle = '', actions = null }) {
    return (
        <header className="inst-topbar p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="inst-title text-lg">{title}</h1>
                    {subtitle ? <p className="inst-muted mt-1 text-sm">{subtitle}</p> : null}
                </div>
                {actions}
            </div>
        </header>
    );
}
