import React from 'react';
import { CeMetricCard } from '../../../components/controlEscolar';

export function AlumnoKpiSkeleton() {
    return (
        <div
            style={{
                flex: '1 1 200px',
                minWidth: 180,
                height: 96,
                borderRadius: 12,
                background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                backgroundSize: '200% 100%',
                animation: 'ceShimmer 1.2s ease-in-out infinite',
            }}
        />
    );
}

export function AlumnoKpiCard({ icon, iconBg, iconColor, title, value, trend, trendColor, onClick, active }) {
    const card = (
        <CeMetricCard
            icon={icon}
            iconBg={iconBg}
            iconColor={iconColor}
            title={title}
            value={value}
            trend={trend}
            trendColor={trendColor}
        />
    );

    if (!onClick) {
        return card;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                flex: '1 1 200px',
                minWidth: 180,
                border: active ? '2px solid #185FA5' : '2px solid transparent',
                borderRadius: 12,
                padding: 0,
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            {card}
        </button>
    );
}
