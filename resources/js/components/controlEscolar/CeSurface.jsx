import { ceTheme } from './ceTheme';

export function CeSurface({ title, children, className = '', style = {} }) {
    return (
        <section className={className} style={{ ...ceTheme.surface, ...style }}>
            {title ? <h2 style={ceTheme.surfaceTitle}>{title}</h2> : null}
            {children}
        </section>
    );
}
