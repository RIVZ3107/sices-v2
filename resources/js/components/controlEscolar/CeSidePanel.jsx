import { ceColors, ceTheme } from './ceTheme';

export function CeSidePanel({ title, children, style = {} }) {
    return (
        <div style={{ ...ceTheme.surface, padding: 20, ...style }}>
            {title ? (
                <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: ceColors.text }}>{title}</h3>
            ) : null}
            {children}
        </div>
    );
}
