import { EsMetricsStrip, formatEsNum, esMetricTones } from '../educacionSuperior';

const TONES = [esMetricTones.blue, esMetricTones.teal, esMetricTones.purple, esMetricTones.green];

export function CatalogoResumenCards({ cards = [], resumen = null, onCardClick }) {
    if (!resumen || cards.length === 0) {
        return null;
    }

    const metrics = cards.map((card, idx) => {
        const data = resumen[card.key] ?? {};
        const tone = TONES[idx % TONES.length];
        return {
            key: card.key,
            ...tone,
            title: card.label,
            value: formatEsNum(data.total ?? 0),
            onClick: onCardClick && card.tab ? () => onCardClick(card.tab) : undefined,
        };
    });

    return <EsMetricsStrip metrics={metrics} wide />;
}
