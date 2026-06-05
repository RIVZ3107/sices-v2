import { EsStatusBadge } from '../../educacionSuperior/EsStatusBadge';
import { esColors, esTheme, formatEsNum } from '../../educacionSuperior/esTheme';
import { formatFechaRango } from './ciclosShared';
import { cpStyles } from './ciclosPeriodosStyles';

const timelineStyles = {
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        position: 'relative',
    },
    item: {
        display: 'grid',
        gridTemplateColumns: '20px 1fr',
        gap: 12,
        paddingBottom: 16,
        position: 'relative',
    },
    line: {
        position: 'absolute',
        left: 9,
        top: 20,
        bottom: 0,
        width: 2,
        background: esColors.border,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: esColors.white,
        border: `2px solid ${esColors.primary}`,
        flexShrink: 0,
        marginTop: 2,
        zIndex: 1,
    },
    dotInactive: {
        borderColor: esColors.mutedLight,
        background: esColors.pageBg,
    },
    card: {
        ...esTheme.card,
        padding: 14,
        borderRadius: 10,
    },
    cardHead: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
    },
    cardTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 700,
        color: esColors.text,
    },
    cardMeta: {
        margin: '2px 0 0',
        fontSize: 12,
        color: esColors.muted,
    },
    cardActions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
    },
    ventana: {
        marginTop: 8,
        padding: '8px 10px',
        borderRadius: 6,
        background: esColors.pageBg,
        fontSize: 11,
        color: esColors.muted,
    },
    ventanaLabel: {
        fontWeight: 600,
        color: esColors.text,
        marginRight: 4,
    },
    empty: {
        padding: 24,
        textAlign: 'center',
        fontSize: 13,
        color: esColors.muted,
        borderRadius: 8,
        border: `1px dashed ${esColors.border}`,
        background: esColors.pageBg,
    },
};

function Ventana({ label, inicio, fin }) {
    if (!inicio && !fin) return null;
    return (
        <div style={timelineStyles.ventana}>
            <span style={timelineStyles.ventanaLabel}>{label}:</span>
            {formatFechaRango(inicio, fin)}
        </div>
    );
}

export function PeriodosTimeline({
    periodos = [],
    loading = false,
    puedeEditar = false,
    onEdit,
    onToggleActivo,
}) {
    if (loading) {
        return <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Cargando periodos…</p>;
    }

    if (periodos.length === 0) {
        return (
            <div style={timelineStyles.empty}>
                Este ciclo aún no tiene periodos registrados.
                {puedeEditar ? ' Use «Agregar periodo» para configurar el primero.' : ''}
            </div>
        );
    }

    return (
        <div style={timelineStyles.list}>
            {periodos.map((p, idx) => {
                const isLast = idx === periodos.length - 1;
                return (
                    <div key={p.id} style={timelineStyles.item}>
                        {!isLast ? <span style={timelineStyles.line} aria-hidden="true" /> : null}
                        <span
                            style={{
                                ...timelineStyles.dot,
                                ...(p.activo ? {} : timelineStyles.dotInactive),
                            }}
                            aria-hidden="true"
                        />
                        <div style={timelineStyles.card}>
                            <div style={timelineStyles.cardHead}>
                                <div>
                                    <p style={timelineStyles.cardTitle}>{p.nombre}</p>
                                    <p style={timelineStyles.cardMeta}>
                                        {p.clave}
                                        {' · '}
                                        {p.tipo_periodo_label ?? p.tipo_periodo}
                                        {' · '}
                                        Núm. {formatEsNum(p.numero_periodo)}
                                    </p>
                                </div>
                                <EsStatusBadge status={p.estatus}>{p.activo ? 'Activo' : 'Inactivo'}</EsStatusBadge>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: esColors.text }}>
                                <strong>Vigencia:</strong> {formatFechaRango(p.fecha_inicio, p.fecha_fin)}
                            </p>
                            <Ventana label="Inscripción" inicio={p.fecha_inicio_inscripcion} fin={p.fecha_fin_inscripcion} />
                            <Ventana label="Calificaciones" inicio={p.fecha_inicio_calificaciones} fin={p.fecha_fin_calificaciones} />
                            {puedeEditar ? (
                                <div style={timelineStyles.cardActions}>
                                    <button type="button" style={{ ...esTheme.btnSecondary, height: 32, fontSize: 12 }} onClick={() => onEdit?.(p)}>
                                        Editar
                                    </button>
                                    <button type="button" style={{ ...esTheme.btnSecondary, height: 32, fontSize: 12 }} onClick={() => onToggleActivo?.(p)}>
                                        {p.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
