import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import { getUser } from '../../authStore';
import { DireccionNotificacionesPage } from '../direccion/DireccionNotificacionesPage';

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
function PriorityBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'baja': { background: '#EAF3DE', color: '#3B6D11' },     // Verde
        'media': { background: '#FEF3C7', color: '#BA7517' },    // Naranja
        'alta': { background: '#FEE2E2', color: '#991B1B' },     // Rojo
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

function MetricCard({ icon, iconBg, iconColor, title, value, trend }) {
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
                <p style={{ fontSize: 11, marginTop: 6, color: '#64748b', fontWeight: 500 }}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

// --- ICONOS UNIFICADOS ---
const Icons = {
    bell: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    alertTriangle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    clock: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    zap: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    checkCircle: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    filter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    settings: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    download: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    moreVertical: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    xIcon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    user: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    calendar: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    info: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    cornerUpLeft: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
    ),
    archive: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    ),
    fileCheck: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <polyline points="9 15 11 17 15 12" />
        </svg>
    ),
    fileText: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    refreshCwSmall: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
    folder: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
};

const TIPO_ICON_COLORS = {
    alert_triangle: '#991B1B',
    file_text: '#534AB7',
    clock: '#BA7517',
    info: '#185FA5',
    settings: '#64748b',
    check_circle: '#0F6E56',
};

function iconoPorTipo(tipo) {
    const map = {
        alert_triangle: Icons.alertTriangle,
        file_text: Icons.fileText,
        clock: Icons.clock,
        info: Icons.info,
        settings: Icons.settings,
        check_circle: Icons.checkCircle,
    };
    return map[tipo] ?? Icons.info;
}

function iconoCategoria(label) {
    const l = String(label).toLowerCase();
    if (l.includes('document')) return Icons.fileText;
    if (l.includes('inscrip')) return Icons.calendar;
    if (l.includes('reinscrip')) return Icons.refreshCwSmall;
    if (l.includes('solicitud')) return Icons.alertTriangle;
    if (l.includes('sistema')) return Icons.zap;
    return Icons.fileText;
}

export function NotificacionesCePage() {
    const roles = getUser()?.roles ?? [];
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [categoria, setCategoria] = useState('todas');
    const [selectedId, setSelectedId] = useState(null);
    const perPage = 8;

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.notificaciones({
                search: search.trim() || undefined,
                categoria: categoria !== 'todas' ? categoria : undefined,
                page,
                per_page: perPage,
                notificacion_id: selectedId ?? undefined,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las notificaciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page, categoria, selectedId]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search, categoria]);

    if (!roles.includes('control_escolar_escuela') && roles.includes('director_escuela')) {
        return <DireccionNotificacionesPage />;
    }

    const metricas = payload?.metricas ?? {};
    const categorias = payload?.categorias ?? [];
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const detalle = payload?.detalle ?? null;
    const total = Number(meta.total) || 0;
    const lastPage = Math.max(1, Number(meta.last_page) || 1);
    const from = meta.from ?? (total === 0 ? 0 : 1);
    const to = meta.to ?? rows.length;

    /* Estilos compartidos de tarjeta (surface) */
    const surface = {
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Centro de notificaciones</h1>
                        <span style={{ color: '#185FA5' }}>{Icons.bell}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{Icons.clock}</span>
                        Actualizado: {loading && !payload ? '…' : formatActualizado(payload?.actualizado_en)}
                        <button
                            type="button"
                            onClick={() => void cargar()}
                            style={{ marginLeft: 8, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, display: 'flex' }}
                            aria-label="Actualizar"
                        >
                            {Icons.refreshCwSmall}
                        </button>
                    </p>
                </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '#', label: 'Marcar todas leídas', icon: Icons.check, color: '#0f172a' },
                        { to: '#', label: 'Filtrar', icon: Icons.filter, color: '#0f172a' },
                        { to: '#', label: 'Preferencias de notificación', icon: Icons.settings, color: '#0f172a' },
                    ].map(({ to, label, icon, color }) => (
                        <Link
                            key={label}
                            to={to}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: color
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                    <Link
                        to="#"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            height: 38, padding: '0 16px', borderRadius: 8,
                            background: 'white', border: '1px solid #e2e8f0',
                            fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#0f172a'
                        }}
                    >
                        <span style={{ color: '#185FA5', display: 'flex' }}>{Icons.download}</span> Exportar
                    </Link>
                </div>
            </div>

            {/* ── Metrics Grid (Tonos Pastel Unificados) ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard 
                    icon={Icons.bell} iconBg="#185FA5" iconColor="white" 
                    title="No leídas" value={formatNum(metricas.no_leidas)}
                    trend={metricas.no_leidas_trend ?? '—'} 
                />
                <MetricCard 
                    icon={Icons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Críticas" value={formatNum(metricas.criticas)}
                    trend={metricas.criticas_trend ?? 'requieren atención'} 
                />
                <MetricCard 
                    icon={Icons.clock} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Recordatorios" value={formatNum(metricas.recordatorios)}
                    trend={metricas.recordatorios_trend ?? 'pendientes de seguimiento'} 
                />
                <MetricCard 
                    icon={Icons.zap} iconBg="#534AB7" iconColor="white" 
                    title="Automáticas" value={formatNum(metricas.automaticas)}
                    trend={metricas.automaticas_trend ?? 'generadas por el sistema'} 
                />
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991B1B', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            {/* ── Main grid (Izquierda Categorías, Centro Tabla, Derecha Detalle) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: 16, alignItems: 'start' }}>

                {/* Left Sidebar: Categorías */}
                <div style={{ ...surface, padding: '16px 0' }}>
                    <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ color: '#64748b' }}>{Icons.filter}</span>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Categorías</h2>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {categorias.map((cat) => {
                            const active = categoria === (cat.key ?? 'todas');
                            const icon = iconoCategoria(cat.label);
                            return (
                            <li key={cat.key ?? cat.label} style={{ padding: '4px 12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setCategoria(cat.key ?? 'todas')}
                                    style={{
                                        width: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: 8,
                                        background: active ? '#EFF6FF' : 'transparent',
                                        color: active ? '#185FA5' : '#475569',
                                        fontWeight: active ? 600 : 500,
                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: active ? '#185FA5' : '#94a3b8' }}>{icon}</span>
                                        <span style={{ fontSize: 13 }}>{cat.label}</span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#185FA5' : '#64748b' }}>{formatNum(cat.n)}</span>
                                </button>
                            </li>
                            );
                        })}
                    </ul>

                </div>

                {/* Center Area: Tabla de Notificaciones */}
                <div style={{ ...surface, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 20px 12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Notificaciones ({formatNum(total)})
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                                {Icons.search}
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar notificación..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    height: 36, width: 220, paddingLeft: 34, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Tipo', 'Mensaje', 'Usuario/Alumno relacionado', 'Fecha ⇅', 'Prioridad', 'Estatus', ''].map((h, i) => (
                                        <th
                                            key={i}
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: h === '' ? 'center' : 'left',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#64748b',
                                                borderBottom: '1px solid #e2e8f0',
                                                whiteSpace: 'nowrap',
                                                background: '#f8fafc'
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((n) => {
                                    const selected = selectedId === n.id || (!selectedId && detalle?.id === n.id);
                                    const color = TIPO_ICON_COLORS[n.tipo] ?? '#185FA5';
                                    return (
                                    <tr
                                        key={n.id}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer', background: selected ? '#f8fafc' : 'white' }}
                                        onClick={() => setSelectedId(n.id)}
                                    >
                                        <td style={{ padding: '16px', width: 40, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {!n.leida ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#185FA5', flexShrink: 0 }} /> : <div style={{ width: 8, height: 8, flexShrink: 0 }} />}
                                                <span style={{ color }}>{iconoPorTipo(n.tipo)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{n.titulo}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.subtitulo}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>{n.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{n.matricula || '—'}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{n.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{n.hora}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <PriorityBadge>{n.prioridad}</PriorityBadge>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: !n.leida ? '#185FA5' : '#94a3b8' }}>
                                                {!n.leida ? 'No leída' : 'Leída'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{ color: '#94a3b8' }}>{Icons.moreVertical}</span>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {total === 0 ? 'Sin notificaciones' : `Mostrando ${from} a ${to} de ${formatNum(total)} notificaciones`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                                >
                                    &lt;
                                </button>
                                <span style={{ minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600 }}>
                                    {page}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= lastPage}
                                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                    style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page >= lastPage ? 'not-allowed' : 'pointer', opacity: page >= lastPage ? 0.5 : 1 }}
                                >
                                    &gt;
                                </button>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{perPage} por página</div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Detalle Fijo */}
                <div style={{ ...surface, position: 'sticky', top: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Detalle de la notificación</h2>
                        <span style={{ color: '#64748b', cursor: 'pointer' }}>{Icons.xIcon}</span>
                    </div>

                    {!detalle ? (
                        <p style={{ fontSize: 13, color: '#64748b' }}>Selecciona una notificación para ver el detalle.</p>
                    ) : (
                        <>
                            {detalle.prioridad === 'Alta' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, color: '#991B1B', marginBottom: 16 }}>
                                    <span>{Icons.alertTriangle}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>Alta prioridad</span>
                                </div>
                            ) : null}
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>{detalle.titulo}</h3>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 12px 0' }}>{detalle.subtitulo}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.user}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Alumno relacionado</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.alumno}{detalle.matricula ? ` (${detalle.matricula})` : ''}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.folder}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Categoría</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.categoria}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.calendar}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Fecha y hora</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.fecha}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.info}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Fuente</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.fuente}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>Detalle</p>
                            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: 0, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                {detalle.motivo || detalle.subtitulo}
                            </p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>Acciones recomendadas</p>
                            <ul style={{ fontSize: 12, color: '#475569', margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
                                {(detalle.acciones ?? []).map((a) => <li key={a}>{a}</li>)}
                            </ul>
                        </div>

                            {detalle.expediente_url ? (
                                <Link
                                    to={detalle.expediente_url}
                                    style={{
                                        display: 'block', width: '100%', height: 40, lineHeight: '40px', borderRadius: 8,
                                        background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600,
                                        textAlign: 'center', textDecoration: 'none', marginBottom: 24,
                                    }}
                                >
                                    Ir al expediente del alumno
                                </Link>
                            ) : null}
                        </>
                    )}
                </div>

            </div>

            {/* Footer */}
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}