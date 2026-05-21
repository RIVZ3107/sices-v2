import { Link } from 'react-router-dom';
import { ceColors, ceTheme } from './ceTheme';

/** Barra de acciones horizontales (enlaces con icono de color). */
export function CeToolbarLinks({ actions = [], trailing = null }) {
    return (
        <div style={ceTheme.toolbarRow}>
            <div style={ceTheme.toolbarGroup}>
                {actions.map(({ label, icon, color, to = '#' }) => (
                    <Link key={label} to={to} style={ceTheme.toolbarAction}>
                        <span style={{ color: color ?? ceColors.primary, display: 'flex', alignItems: 'center' }}>{icon}</span>
                        <span>{label}</span>
                    </Link>
                ))}
            </div>
            {trailing}
        </div>
    );
}

/** Tarjetas de acción en rejilla (estilo Observaciones / acciones rápidas). */
export function CeActionCards({ actions = [] }) {
    return (
        <div style={ceTheme.actionCardGrid}>
            {actions.map(({ label, icon, color, to = '#' }) => (
                <Link key={label} to={to} style={ceTheme.actionCard}>
                    <span style={{ color: color ?? ceColors.primary, display: 'flex' }}>{icon}</span>
                    <span>{label}</span>
                </Link>
            ))}
        </div>
    );
}
