import { ceColors, ceTheme } from './ceTheme';

export function CeMetricCard({
    icon,
    iconBg,
    iconColor,
    title,
    value,
    trend,
    trendColor,
    trendPrefix = null,
    valueSize = 24,
    flex = true,
    compact = true,
}) {
    const trendLine =
        trend === undefined || trend === null || trend === ''
            ? null
            : (
                <p
                    style={{
                        fontSize: 11,
                        marginTop: 6,
                        color: trendColor ?? ceColors.muted,
                        fontWeight: 500,
                    }}
                >
                    {trendPrefix === '' ? trend : `${trendPrefix ?? ''}${trendPrefix ? ' ' : ''}${trend}`}
                </p>
            );

    const iconSize = compact ? 48 : 56;

    return (
        <div
            style={{
                ...ceTheme.card,
                padding: compact ? '16px' : 20,
                display: 'flex',
                alignItems: 'center',
                gap: compact ? 14 : 16,
                flex: flex ? 1 : undefined,
                minWidth: flex ? 0 : undefined,
            }}
        >
            <div
                style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: '50%',
                    background: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 12, color: ceColors.muted, marginBottom: 4, fontWeight: 500, margin: '0 0 4px' }}>{title}</p>
                <p style={{ margin: 0, fontSize: valueSize, fontWeight: 700, color: ceColors.text, lineHeight: 1 }}>{value}</p>
                {trendLine}
            </div>
        </div>
    );
}
