import { Link } from 'react-router-dom';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';

const ESTADO_STYLE = {
    listo: { bg: '#dcfce7', color: '#166534', dot: '#16a34a', label: 'Completo' },
    pendiente: { bg: '#fef9c3', color: '#854d0e', dot: '#ca8a04', label: 'Pendiente' },
    bloqueado: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626', label: 'Requiere atención' },
    captura: { bg: '#e0f2fe', color: '#075985', dot: '#0284c7', label: 'En captura' },
};

function pill(estado) {
    const st = ESTADO_STYLE[estado] ?? ESTADO_STYLE.pendiente;
    return (
        <span
            style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: st.bg,
                color: st.color,
            }}
        >
            {st.label}
        </span>
    );
}

/**
 * Barra de avance y tarjetas del expediente 360 (pestaña Resumen).
 */
export function ExpedienteAvanceResumen({ alumnoPk, data }) {
    const mat = data?.matricula;
    const trayectoria = data?.trayectoria;
    const materias = data?.materias_cursadas ?? [];
    const inscripciones = data?.inscripciones_periodo ?? [];
    const docs = data?.documentos_certificacion ?? [];
    const observacionesPend = docs.filter((d) => d.requiere_revision_observaciones);

    const modulos = [
        {
            key: 'matricula',
            titulo: 'Matrícula',
            desc: mat?.clave_matricula
                ? `Clave ${mat.clave_matricula} · ${sanitizeInstitutionalLabel(mat.subsistema, 'subsistema')}.`
                : 'Sin matrícula asignada; solicite a Educación Superior.',
            estado: mat?.clave_matricula ? 'listo' : 'bloqueado',
            accion: 'Gestionar matrícula',
            tab: 'matricula',
        },
        {
            key: 'inscripcion',
            titulo: 'Inscripción',
            desc: inscripciones.length > 0 ? `${inscripciones.length} periodo(s) registrado(s).` : 'Sin inscripción al periodo vigente.',
            estado: inscripciones.length > 0 ? 'listo' : 'pendiente',
            accion: 'Ver inscripción',
            tab: 'inscripcion',
        },
        {
            key: 'carga',
            titulo: 'Carga académica',
            desc: materias.length > 0 ? `${materias.length} materia(s) en expediente.` : 'Registre la carga del alumno.',
            estado: materias.length > 0 ? 'listo' : 'pendiente',
            accion: 'Ver carga',
            tab: 'carga',
        },
        {
            key: 'calificaciones',
            titulo: 'Calificaciones',
            desc: materias.length > 0 ? 'Captura y revisión de calificaciones.' : 'Pendiente de materias cursadas.',
            estado: materias.length > 0 ? 'captura' : 'pendiente',
            accion: 'Capturar calificaciones',
            tab: 'calificaciones',
        },
        {
            key: 'trayectoria',
            titulo: 'Trayectoria',
            desc: trayectoria
                ? `Promedio ${trayectoria.promedio ?? '—'} · créditos ${trayectoria.creditos_obtenidos ?? '—'}.`
                : 'Consolide trayectoria antes de solicitud documental.',
            estado: trayectoria ? 'listo' : 'bloqueado',
            accion: 'Ir a trayectoria',
            tab: 'trayectoria',
        },
        {
            key: 'certificacion',
            titulo: 'Certificación',
            desc: docs.length > 0 ? `${docs.length} solicitud(es) documental(es) en historial.` : 'Sin solicitud documental activa.',
            estado: docs.some((d) => ['borrador', 'pendiente', 'en_revision'].includes(d.estado_workflow))
                ? 'captura'
                : trayectoria && mat?.clave_matricula
                  ? 'listo'
                  : 'pendiente',
            accion: 'Solicitud documental',
            tab: 'certificacion',
            href: `/app/certificacion/solicitud?alumno=${alumnoPk}`,
        },
    ];

    const completos = modulos.filter((m) => m.estado === 'listo').length;
    const pct = Math.round((completos / modulos.length) * 100);

    return (
        <div className="grid gap-4">
            <div
                style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Estado general del expediente</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                        {completos} de {modulos.length} áreas completas ({pct}%)
                    </span>
                </div>
                <div
                    style={{
                        height: 8,
                        borderRadius: 4,
                        background: '#e2e8f0',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #185FA5, #0F6E56)',
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 10,
                        fontSize: 11,
                        color: '#64748b',
                    }}
                >
                    {modulos.map((m) => (
                        <span key={m.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: ESTADO_STYLE[m.estado]?.dot ?? '#94a3b8',
                                }}
                            />
                            {m.titulo}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {modulos.map((card) => (
                    <article
                        key={card.key}
                        style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '14px 16px',
                            background: '#fff',
                            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{card.titulo}</h3>
                            {pill(card.estado)}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>{card.desc}</p>
                        {card.href ? (
                            <Link to={card.href} className="inst-btn inst-btn-primary text-xs mt-3 inline-flex">
                                {card.accion}
                            </Link>
                        ) : (
                            <Link
                                to={`/app/alumnos/${alumnoPk}/expediente?tab=${card.tab}`}
                                className="inst-btn inst-btn-secondary text-xs mt-3 inline-flex"
                            >
                                {card.accion}
                            </Link>
                        )}
                    </article>
                ))}
                {observacionesPend.length > 0 ? (
                    <article
                        style={{
                            border: '1px solid #fde68a',
                            borderRadius: 10,
                            padding: '14px 16px',
                            background: '#fffbeb',
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#92400e' }}>Observaciones</h3>
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#78350f' }}>
                            {observacionesPend.length} solicitud(es) con observaciones pendientes.
                        </p>
                        <Link to={`/app/observaciones?alumno=${alumnoPk}`} className="inst-btn inst-btn-secondary text-xs mt-3 inline-flex">
                            Atender observaciones
                        </Link>
                    </article>
                ) : null}
            </div>
        </div>
    );
}
