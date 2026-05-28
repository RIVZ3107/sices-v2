import { esColors, esTheme } from './esTheme';

export function EsMetricCard({
    icon,
    iconBg,
    iconColor,
    title,
    value,
    trend,
    trendPrefix = null,
    valueSize = 28,
    flex = true,
    onClick = null,
}) {
    const trendLine =
        trend === undefined || trend === null || trend === ''
            ? null
            : (
                <p
                    style={{
                        margin: '6px 0 0',
                        fontSize: 11,
                        color: trendPrefix === '' ? esColors.muted : '#0F6E56',
                        fontWeight: trendPrefix === '' ? 500 : 600,
                    }}
                >
                    {trendPrefix === '' ? trend : `${trendPrefix ?? '↑'} ${trend}`}
                </p>
            );

    const clickable = typeof onClick === 'function';

    return (
        <div
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? onClick : undefined}
            onKeyDown={
                clickable
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
            style={{
                ...esTheme.card,
                padding: valueSize >= 30 ? 20 : 18,
                display: 'flex',
                alignItems: 'center',
                gap: valueSize >= 30 ? 16 : 14,
                flex: flex ? 1 : undefined,
                minWidth: flex ? 220 : undefined,
                cursor: clickable ? 'pointer' : undefined,
            }}
        >
            <div
                style={{
                    width: 56,
                    height: 56,
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
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{title}</p>
                <p style={{ margin: 0, fontSize: valueSize, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                {trendLine}
            </div>
        </div>
    );
}
