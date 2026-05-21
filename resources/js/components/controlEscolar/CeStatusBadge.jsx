import { ceBadgeColors, cePriorityColors } from './ceTheme';

const STATUS_MAP = {
    activo: 'legacyGreen',
    activa: 'green',
    vigente: 'green',
    aprobada: 'green',
    aprobado: 'green',
    completado: 'green',
    completo: 'green',
    completos: 'green',
    confirmada: 'green',
    autorizado: 'green',
    autorizada: 'green',
    resuelto: 'green',
    atendida: 'green',
    leída: 'green',
    capturada: 'green',
    disponible: 'green',
    concluido: 'green',
    egresado: 'purple',
    pendiente: 'yellow',
    'en proceso': 'blue',
    'en revisión': 'blue',
    prevalidada: 'blue',
    programado: 'blue',
    'no leída': 'blue',
    'por validar': 'yellow',
    'con observaciones': 'yellow',
    observada: 'red',
    rechazado: 'red',
    rechazada: 'red',
    reprobada: 'red',
    bloqueada: 'red',
    vencida: 'red',
    crítica: 'red',
    devuelta: 'yellow',
    'baja temporal': 'yellow',
    'corrección solicitada': 'yellow',
    próximo: 'yellow',
    'pendiente de conciliación': 'yellow',
    media: 'yellow',
    baja: 'green',
    alta: 'red',
    'con errores': 'red',
};

const TONE_MAP = {
    green: 'green',
    blue: 'blue',
    orange: 'yellow',
    red: 'red',
    yellow: 'yellow',
    purple: 'purple',
    neutral: 'gray',
};

export function CeStatusBadge({ children, color, tone, status }) {
    let resolved = color ?? (tone ? TONE_MAP[tone] : null);
    if (!resolved && status !== undefined) {
        resolved = STATUS_MAP[String(status).toLowerCase()];
    }
    if (!resolved && children !== undefined) {
        resolved = STATUS_MAP[String(children).toLowerCase()];
    }
    const s = ceBadgeColors[resolved] ?? ceBadgeColors.gray;

    return (
        <span
            style={{
                ...s,
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );
}

export function CePriorityBadge({ children }) {
    const s = cePriorityColors[String(children).toLowerCase()] ?? ceBadgeColors.gray;
    return (
        <span
            style={{
                ...s,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );
}
