import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';

function formatActualizado(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
    } catch {
        return '—';
    }
}

function formatNum(n) {
    return new Intl.NumberFormat('es-MX').format(Number(n) || 0);
}

// --- UTILIDADES DE ESTILO (PALETA UNIFICADA BASE) ---
function initials(nombre = '') {
    return nombre
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('');
}

const AVATAR_COLORS = [
    { bg: '#DBEAFE', text: '#185FA5' }, // Azul
    { bg: '#DCFCE7', text: '#0F6E56' }, // Verde
    { bg: '#FEF3C7', text: '#BA7517' }, // Naranja
    { bg: '#EEEDFE', text: '#534AB7' }, // Morado
    { bg: '#F1F5F9', text: '#475569' }, // Gris
];

function avatarStyle(i) {
    const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
    return { backgroundColor: c.bg, color: c.text };
}

function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        // Estado
        'atendida': { background: '#EAF3DE', color: '#3B6D11' },     // Verde
        'pendiente': { background: '#DBEAFE', color: '#185FA5' },    // Azul
        'en revisión': { background: '#FEF3C7', color: '#BA7517' },  // Naranja
        'devuelta': { background: '#FEF3C7', color: '#BA7517' },     // Naranja
        'vencida': { background: '#FEE2E2', color: '#991B1B' },      // Rojo
        
        // Prioridad
        'baja': { background: '#EAF3DE', color: '#3B6D11' },         // Verde
        'media': { background: '#FEF3C7', color: '#BA7517' },        // Naranja
        'alta': { background: '#FEE2E2', color: '#991B1B' },         // Rojo
    };
    const s = styles[v] ?? { background: '#F1EFE8', color: '#5F5E5A' };
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

function MetricCard({ icon, iconBg, iconColor, title, value, trend, trendColor }) {
    return (
        <div
            style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flex: 1,
                minWidth: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{title}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, marginTop: 6, color: trendColor, fontWeight: 500 }}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

// --- ICONOS UNIFICADOS ---
const Icons = {
    messageCircle: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    ),
    messageCircleBig: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    ),
    paperclip: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    checkCircle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    folderOpen: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 20V4c0-1.1.9-2 2-2h6l2 2h10a2 2 0 0 1 2 2v1l-22 13z" />
        </svg>
    ),
    scrollText: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v11" />
            <path d="M10 5h12a2 2 0 0 1 2 2v2H10V5z" />
        </svg>
    ),
    refreshCw: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
    alertTriangle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    filter: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
};

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
    const surface = {
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    };

    const surfaceTitle = {
        fontSize: 14,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 0,
    };

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* ── Header Layout ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Observaciones</h1>
                        {Icons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Seguimiento académico y documental. Sin solicitar identificadores técnicos al usuario final.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '/app/observaciones', label: 'Responder', icon: Icons.messageCircle, color: '#185FA5' },
                        { to: '/app/observaciones', label: 'Adjuntar evidencia', icon: Icons.paperclip, color: '#0F6E56' },
                        { to: '/app/observaciones', label: 'Marcar atendida', icon: Icons.check, color: '#BA7517' },
                        { to: detalle?.expediente_url ?? '/app/control-escolar/expedientes', label: 'Abrir expediente', icon: Icons.folderOpen, color: '#534AB7' },
                        { to: '/app/observaciones', label: 'Ver historial', icon: Icons.scrollText, color: '#64748b' },
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
                <MetricCard 
                    icon={Icons.messageCircleBig} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Observaciones pendientes" value={formatNum(metricas.pendientes)}
                    trend={metricas.pendientes_trend ?? 'Por atender'} trendColor={metricas.pendientes_trend_color ?? '#185FA5'} 
                />
                <MetricCard 
                    icon={Icons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Atendidas" value={formatNum(metricas.atendidas)}
                    trend={metricas.atendidas_trend ?? 'Últimos 60 días'} trendColor={metricas.atendidas_trend_color ?? '#0F6E56'} 
                />
                <MetricCard 
                    icon={Icons.refreshCw} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Devueltas" value={formatNum(metricas.devueltas)}
                    trend={metricas.devueltas_trend ?? 'Requieren nueva acción'} trendColor={metricas.devueltas_trend_color ?? '#BA7517'} 
                />
                <MetricCard 
                    icon={Icons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Vencidas" value={formatNum(metricas.vencidas)}
                    trend={metricas.vencidas_trend ?? 'Prioridad alta'} trendColor={metricas.vencidas_trend_color ?? '#991B1B'} 
                />
            </div>

            {/* ── Main grid (Izquierda Tabla, Derecha Paneles) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                {/* Left Area: Tabla */}
                <div style={surface}>
                    {/* Table top bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Bandeja de observaciones
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {Icons.search}
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
                                <span style={{ display: 'flex', alignItems: 'center', color: '#185FA5' }}>{Icons.filter}</span>
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
                                                background: '#f8fafc'
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
                                            <StatusBadge>{r.prioridad}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.estado}</StatusBadge>
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
                                                        {Icons.eye}
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
                                                        {Icons.check}
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
                                ? `Mostrando ${meta.from ?? 0} a ${meta.to ?? 0} de ${formatNum(meta.total)} observaciones`
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
                    <div style={surface}>
                        <p style={surfaceTitle}>Detalle de observación</p>
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
                    <div style={surface}>
                        <p style={surfaceTitle}>Evidencia</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                            Arrastra archivos o selecciona desde tu equipo (PDF / JPG, máx. 10 MB).
                        </p>
                        <button
                            type="button"
                            style={{
                                width: '100%', height: 36, borderRadius: 8,
                                background: '#f8fafc', border: '1px dashed #cbd5e1',
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
                    <div style={surface}>
                        <p style={surfaceTitle}>Historial</p>
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