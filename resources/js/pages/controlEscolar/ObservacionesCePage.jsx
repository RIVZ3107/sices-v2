import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeIcons,
    CeMetricCard,
    CePriorityBadge,
    CeQuickAction,
    CeStatusBadge,
    ceAvatarStyle,
    ceColors,
    ceInitials,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';

export function ObservacionesCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [selectedId, setSelectedId] = useState(null);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.observaciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
                observacion_id: selectedId ?? undefined,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las observaciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage, selectedId]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const detalle = payload?.detalle ?? null;
    const historial = payload?.historial ?? [];
    const lastPage = Math.max(1, Number(meta.last_page) || 1);

    /* Estilos compartidos de tarjeta (surface) */
        return (
        <div style={{ ...ceTheme.pageShell }}>

            {/* ── Header Layout ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Observaciones</h1>
                        {CeIcons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Seguimiento académico y documental. Sin solicitar identificadores técnicos al usuario final.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '/app/observaciones', label: 'Responder', icon: CeIcons.messageCircle, color: '#185FA5' },
                        { to: '/app/observaciones', label: 'Adjuntar evidencia', icon: CeIcons.paperclip, color: '#0F6E56' },
                        { to: '/app/observaciones', label: 'Marcar atendida', icon: CeIcons.check, color: '#BA7517' },
                        { to: detalle?.expediente_url ?? '/app/control-escolar/expedientes', label: 'Abrir expediente', icon: CeIcons.folderOpen, color: '#534AB7' },
                        { to: '/app/observaciones', label: 'Ver historial', icon: CeIcons.scrollText, color: '#64748b' },
                    ].map(({ to, label, icon, color }) => (
                        <Link
                            key={label}
                            to={to}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span style={{ color: '#0f172a' }}>{label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991B1B', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            {/* ── Metrics Grid (Tonos Pastel Unificados) ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard 
                    icon={CeIcons.messageCircleBig} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Observaciones pendientes" value={formatCeNum(metricas.pendientes)}
                    trend={metricas.pendientes_trend ?? 'Por atender'} trendColor={metricas.pendientes_trend_color ?? '#185FA5'} 
                />
                <CeMetricCard 
                    icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Atendidas" value={formatCeNum(metricas.atendidas)}
                    trend={metricas.atendidas_trend ?? 'Últimos 60 días'} trendColor={metricas.atendidas_trend_color ?? '#0F6E56'} 
                />
                <CeMetricCard 
                    icon={CeIcons.refreshCw} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Devueltas" value={formatCeNum(metricas.devueltas)}
                    trend={metricas.devueltas_trend ?? 'Requieren nueva acción'} trendColor={metricas.devueltas_trend_color ?? '#BA7517'} 
                />
                <CeMetricCard 
                    icon={CeIcons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Vencidas" value={formatCeNum(metricas.vencidas)}
                    trend={metricas.vencidas_trend ?? 'Prioridad alta'} trendColor={metricas.vencidas_trend_color ?? '#991B1B'} 
                />
            </div>

            {/* ── Main grid (Izquierda Tabla, Derecha Paneles) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                {/* Left Area: Tabla */}
                <div style={ceTheme.surface}>
                    {/* Table top bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Bandeja de observaciones
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {CeIcons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar por folio o alumno..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        height: 36, width: 250,
                                        paddingLeft: 34, paddingRight: 12,
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        fontSize: 13, color: '#0f172a', background: 'white',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <button style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer' }}>
                                <span style={{ display: 'flex', alignItems: 'center', color: '#185FA5' }}>{CeIcons.filter}</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Alumno', 'Módulo', 'Observación', 'Prioridad', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 10px',
                                                textAlign: h === 'Acciones' ? 'center' : 'left',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#64748b',
                                                borderBottom: '1px solid #e2e8f0',
                                                whiteSpace: 'nowrap',
                                                background: ceColors.pageBg
                                            }}
                                        >
                                            {h !== 'Acciones' ? `${h} ⇅` : h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                                            Cargando observaciones…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                                            No hay observaciones registradas en tu alcance.
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r) => (
                                    <tr
                                        key={r.id ?? r.folio}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.2s',
                                            background: selectedId === r.id ? '#EFF6FF' : 'transparent',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedId(r.id)}
                                        onMouseEnter={(e) => { if (selectedId !== r.id) e.currentTarget.style.background = '#f8fafc'; }}
                                        onMouseLeave={(e) => { if (selectedId !== r.id) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                                            <span style={{ color: '#185FA5' }}>{r.folio}</span>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.alumno}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.modulo}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {r.texto}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.prioridad}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estado}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 12, color: '#64748b' }}>{r.fecha}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {r.detalle_url ? (
                                                    <Link
                                                        to={r.detalle_url}
                                                        title="Ver"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            width: 26, height: 26, borderRadius: 6,
                                                            background: 'white', border: '1px solid #e2e8f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#185FA5', flexShrink: 0,
                                                        }}
                                                    >
                                                        {CeIcons.eye}
                                                    </Link>
                                                ) : null}
                                                {r.detalle_url ? (
                                                    <Link
                                                        to={r.detalle_url}
                                                        title="Atender"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            width: 26, height: 26, borderRadius: 6,
                                                            background: 'white', border: '1px solid #e2e8f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#0F6E56', flexShrink: 0,
                                                        }}
                                                    >
                                                        {CeIcons.check}
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.total
                                ? `Mostrando ${meta.from ?? 0} a ${meta.to ?? 0} de ${formatCeNum(meta.total)} observaciones`
                                : 'Sin observaciones'}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
                                }}
                            >
                                &lt;
                            </button>
                            <span style={{ minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#185FA5', color: 'white', fontSize: 13, padding: '0 8px' }}>
                                {page}
                            </span>
                            <button
                                type="button"
                                disabled={page >= lastPage || loading}
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: page >= lastPage ? 'not-allowed' : 'pointer', opacity: page >= lastPage ? 0.5 : 1,
                                }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Paneles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Detalle de observación */}
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Detalle de observación</p>
                        {detalle ? (
                            <>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>{detalle.folio}</p>
                                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.5 }}>{detalle.texto}</p>
                                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px 0' }}>Alumno: <strong style={{ color: '#0f172a', fontWeight: 500 }}>{detalle.alumno}</strong></p>
                                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Módulo: <strong style={{ color: '#0f172a', fontWeight: 500 }}>{detalle.modulo}</strong></p>
                            </>
                        ) : (
                            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Selecciona una observación de la bandeja.</p>
                        )}
                    </div>

                    {/* Evidencia */}
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Evidencia</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                            Arrastra archivos o selecciona desde tu equipo (PDF / JPG, máx. 10 MB).
                        </p>
                        <button
                            type="button"
                            style={{
                                width: '100%', height: 36, borderRadius: 8,
                                background: ceColors.pageBg, border: '1px dashed #cbd5e1',
                                fontSize: 13, fontWeight: 600, color: '#185FA5',
                                cursor: 'pointer', transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                        >
                            Subir evidencia
                        </button>
                    </div>

                    {/* Historial */}
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Historial</p>
                        <div style={{ position: 'relative', paddingLeft: 12, borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {historial.length === 0 ? (
                                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Sin historial disponible.</p>
                            ) : historial.map((ev, idx) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: -17, top: 4, width: 8, height: 8, borderRadius: '50%', background: ev.activo ? '#185FA5' : '#cbd5e1' }} />
                                    <p style={{ fontSize: 12, fontWeight: 500, color: ev.activo ? '#0f172a' : '#475569', margin: 0 }}>{ev.titulo}</p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{ev.subtitulo}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2026 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}