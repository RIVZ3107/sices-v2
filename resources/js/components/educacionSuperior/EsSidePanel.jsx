import { esColors, esTheme } from './esTheme';

export function EsSidePanel({ title, children }) {
    return (
        <div style={{ ...esTheme.card, padding: 20 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: esColors.text }}>{title}</h3>
            {children}
        </div>
    );
}
