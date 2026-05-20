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

// --- UTILIDADES DE ESTILO (PALETA UNIFICADA) ---
function StatusBadge({ children, tone }) {
    const v = String(children).toLowerCase();
    
    // Mapeo por defecto si no se pasa un 'tone' específico
    const defaultStyles = {
        'aprobada': { background: '#DCFCE7', color: '#0F6E56' },
        'pendiente': { background: '#DCFCE7', color: '#0F6E56' },
        'en revisión': { background: '#DBEAFE', color: '#185FA5' },
        'observada': { background: '#FEE2E2', color: '#991B1B' },
        'rechazada': { background: '#FEE2E2', color: '#991B1B' },
    };

    // Mapeo de tonos forzados (para cuando "En revisión" pueda ser naranja o azul)
    const toneStyles = {
        'green': { background: '#DCFCE7', color: '#0F6E56' },
        'blue': { background: '#DBEAFE', color: '#185FA5' },
        'orange': { background: '#FFEDD5', color: '#C2410C' },
        'red': { background: '#FEE2E2', color: '#991B1B' },
    };

    const s = tone ? toneStyles[tone] : (defaultStyles[v] ?? { background: '#F1EFE8', color: '#5F5E5A' });
    
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
    plus: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    clock: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    graduationCap: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    check: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    xIcon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    lock: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    boxX: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
    ),
    alertTriangle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    download: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    pencil: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    history: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <polyline points="12 7 12 12 15 15" />
        </svg>
    ),
    infoCircle: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
};

const TYPE_ICONS = {
    lock: Icons.lock,
    boxX: Icons.boxX,
    users: Icons.users,
    clock: Icons.clock,
    graduationCap: Icons.graduationCap,
};

export function BajasCambiosPage() {
    const [search, setSearch] = useState('');
    const [estatusFiltro, setEstatusFiltro] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.bajasCambios({
                search: search.trim() || undefined,
                estatus: estatusFiltro || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las bajas y cambios.');
        } finally {
            setLoading(false);
        }
    }, [search, estatusFiltro, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search, estatusFiltro]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const motivosDonut = payload?.motivos_frecuentes ?? [];
    const cambiosRecientes = payload?.cambios_recientes ?? [];
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

    const grad = motivosDonut.length > 0
        ? `conic-gradient(${motivosDonut.map((m, i, arr) => {
            const start = (arr.slice(0, i).reduce((s, x) => s + x.pct, 0) / 100) * 360;
            const end = (arr.slice(0, i + 1).reduce((s, x) => s + x.pct, 0) / 100) * 360;
            return `${m.color} ${start}deg ${end}deg`;
        }).join(', ')})`
        : 'conic-gradient(#e2e8f0 0deg 360deg)';

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

                
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Bajas y cambios de estatus</h1>
                    {Icons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { label: 'Nueva baja', icon: Icons.plus, color: '#185FA5' },
                        { label: 'Cambio de grupo', icon: Icons.users, color: '#185FA5' },
                        { label: 'Cambio de turno', icon: Icons.clock, color: '#0F6E56' },
                        { label: 'Cambio de programa', icon: Icons.graduationCap, color: '#534AB7' },
                        { label: 'Aprobar', icon: Icons.check, color: '#0F6E56' },
                        { label: 'Rechazar', icon: Icons.xIcon, color: '#DC2626' },
                    ].map(({ label, icon, color }) => (
                        <Link
                            key={label}
                            to="#"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
                <Link
                    to="#"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{Icons.download}</span> Exportar v
                </Link>
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard
                    icon={Icons.lock} iconBg="#FEE2E2" iconColor="#DC2626"
                    title="Bajas temporales"
                    value={loading && !payload ? '…' : formatNum(metricas.bajas_temporales)}
                    trend="En tu alcance operativo"
                    trendColor="#64748b"
                />
                <MetricCard
                    icon={Icons.boxX} iconBg="#F3E8FF" iconColor="#6B21A8"
                    title="Bajas definitivas"
                    value={loading && !payload ? '…' : formatNum(metricas.bajas_definitivas)}
                    trend="Registros consolidados"
                    trendColor="#64748b"
                />
                <MetricCard
                    icon={Icons.users} iconBg="#DBEAFE" iconColor="#185FA5"
                    title="Cambios pendientes"
                    value={loading && !payload ? '…' : formatNum(metricas.cambios_pendientes)}
                    trend="Pendientes o en revisión"
                    trendColor="#BA7517"
                />
                <MetricCard
                    icon={Icons.alertTriangle} iconBg="#FFEDD5" iconColor="#EA580C"
                    title="Solicitudes observadas"
                    value={loading && !payload ? '…' : formatNum(metricas.solicitudes_observadas)}
                    trend="Requieren atención"
                    trendColor="#DC2626"
                />
            </div>

            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                
                <div style={surface}>   
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Solicitudes de bajas y cambios {Icons.infoCircle}
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <select
                                value={estatusFiltro}
                                onChange={(e) => setEstatusFiltro(e.target.value)}
                                style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}
                            >
                                <option value="">Todos los estatus</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En revisión">En revisión</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Observada">Observada</option>
                                <option value="Rechazada">Rechazada</option>
                            </select>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    {Icons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar en la tabla..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        height: 36, width: 220,
                                        paddingLeft: 34, paddingRight: 12,
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        fontSize: 13, color: '#0f172a', background: 'white',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Alumno', 'Tipo de cambio', 'Motivo', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
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
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando solicitudes…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay bajas o cambios registrados en tu alcance.
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#475569' }}>
                                                <span style={{ color: r.type_color ?? r.typeColor }}>
                                                    {TYPE_ICONS[r.type_key] ?? Icons.lock}
                                                </span>
                                                {r.tipo}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 12, color: '#475569' }}>{r.motivo}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.hora}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge tone={r.tone}>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, color: '#185FA5' },
                                                    { icon: Icons.check, color: '#0F6E56' },
                                                    { icon: Icons.xIcon, color: '#DC2626' },
                                                    { icon: Icons.pencil, color: '#185FA5' },
                                                    { icon: Icons.history, color: '#185FA5' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{ 
                                                            width: 26, height: 26, borderRadius: 6, 
                                                            border: '1px solid #e2e8f0', background: 'white',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            color: btn.color, cursor: 'pointer'
                                                        }}
                                                    >
                                                        {btn.icon}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatNum(meta.total)} resultados`
                                : `Total: ${formatNum(meta.total ?? 0)} resultados`}
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
                                {meta.current_page ?? page}
                            </span>
                            <button
                                type="button"
                                disabled={loading || (meta.last_page ?? 1) <= page}
                                onClick={() => setPage((p) => p + 1)}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: (meta.last_page ?? 1) <= page ? 'not-allowed' : 'pointer', opacity: (meta.last_page ?? 1) <= page ? 0.5 : 1,
                                }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={surface}>
                        <p style={surfaceTitle}>Motivos frecuentes</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                            <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white' }} />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                {motivosDonut.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                                            <span style={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{m.label}</span>
                                        </div>
                                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{m.pct}% <span style={{ color: '#94a3b8', fontWeight: 400 }}>({m.count})</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={surface}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Cambios recientes</p>
                            <Link to="#" style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todos</Link>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: 10 }}>
                            <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {cambiosRecientes.map((c, i) => (
                                    <div key={i} style={{ position: 'relative', paddingLeft: 24 }}>
                                        <div style={{ position: 'absolute', left: 1, top: 4, width: 8, height: 8, borderRadius: '50%', background: c.color, border: '2px solid white' }} />
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>{c.text}</p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>{c.subtext}</p>
                                        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{c.date}</p>
                                    </div>
                       
                       ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}