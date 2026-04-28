export function StatCard({ title, value = 0, tone = 'default', subtitle = '' }) {
    const toneClass =
        tone === 'success'
            ? 'text-[var(--inst-green)]'
            : tone === 'warning'
                ? 'text-[var(--inst-yellow)]'
                : tone === 'danger'
                    ? 'text-[var(--inst-red)]'
                    : 'text-[var(--inst-navy)]';

    return (
        <article className="inst-surface p-4">
            <p className="inst-muted text-xs uppercase">{title}</p>
            <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
            {subtitle ? <p className="inst-muted mt-1 text-xs">{subtitle}</p> : null}
        </article>
    );
}
