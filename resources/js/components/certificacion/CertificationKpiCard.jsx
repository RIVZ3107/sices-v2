import { Link } from 'react-router-dom';
import { EsMetricCard } from '../educacionSuperior';
import { formatEsNum } from '../educacionSuperior/esTheme';

/**
 * KPI institucional — reutiliza EsMetricCard del módulo Educación Superior.
 */
export function CertificationKpiCard({
    icon,
    iconBg,
    iconColor,
    title,
    value,
    description,
    quickLink,
    quickLabel = 'Ver detalle →',
}) {
    const inner = (
        <EsMetricCard
            icon={icon}
            iconBg={iconBg}
            iconColor={iconColor}
            title={title}
            value={formatEsNum(value)}
            trend={description}
            trendPrefix=""
            flex
            compact
        />
    );

    if (quickLink) {
        return (
            <Link to={quickLink} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                {inner}
                <span style={{ display: 'block', fontSize: 11, color: '#185FA5', marginTop: -8, paddingLeft: 4 }}>
                    {quickLabel}
                </span>
            </Link>
        );
    }

    return inner;
}
