import { esBadgeColors } from './esTheme';

const STATUS_MAP = {
    activa: 'green',
    activo: 'green',
    vigente: 'green',
    aprobada: 'green',
    aprobado: 'green',
    completado: 'green',
    matricula_asignada: 'green',
    pendiente: 'yellow',
    enviada: 'yellow',
    'en revisión': 'blue',
    en_revision: 'blue',
    observado: 'yellow',
    con_observaciones: 'red',
    rechazada: 'red',
    rechazado: 'red',
    cancelado: 'red',
    alta: 'red',
    media: 'yellow',
    baja: 'green',
};

export function EsStatusBadge({ children, color, status }) {
    let resolved = color;
    if (!resolved && status !== undefined) {
        resolved = STATUS_MAP[String(status).toLowerCase()] ?? STATUS_MAP[String(children).toLowerCase()];
    }
    if (!resolved && children !== undefined) {
        resolved = STATUS_MAP[String(children).toLowerCase()];
    }
    const s = esBadgeColors[resolved] ?? esBadgeColors.gray;

    return (
        <span
            style={{
                ...s,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
            }}
        >
            {children}
        </span>
    );
}
