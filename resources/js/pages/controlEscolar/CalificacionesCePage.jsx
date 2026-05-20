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
        'capturada': { background: '#EAF3DE', color: '#3B6D11' },      // Verde pastel
        'pendiente': { background: '#FAEEDA', color: '#854F0B' },      // Naranja pastel
        'en corrección': { background: '#EEEDFE', color: '#534AB7' },
        'corrección solicitada': { background: '#EEEDFE', color: '#534AB7' },
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

const Icons = {
    users: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    trendingUp: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    hourglass: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 2H6v6l4 4-4 4v6h12v-6l-4-4 4-4V2z" />
        </svg>
    ),
    messageSquare: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    pencil: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    upload: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    ),
    cornerUpLeft: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
    ),
    history: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <polyline points="12 7 12 12 15 15" />
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
    filter: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
};

export function CalificacionesCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.calificaciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar las calificaciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const metricas = payload?.metricas ?? {};
    const grupos = payload?.grupos ?? [];
    const calificaciones = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const avanceGlobal = payload?.avance_global?.porcentaje ?? metricas.avance_global_pct ?? 0;
    const avanceDescripcion = payload?.avance_global?.descripcion ?? '';

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

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Calificaciones</h1>
                        {Icons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Captura e importación operativa. La autorización final de correcciones y el cierre global no corresponden a Control Escolar.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '/app/coordinador/dashboard', label: 'Capturar calificación', icon: Icons.pencil, color: '#185FA5' },
                        { to: '/app/importaciones', label: 'Importar calificaciones', icon: Icons.upload, color: '#0F6E56' },
                        { to: '/app/control-escolar/calificaciones', label: 'Solicitar corrección', icon: Icons.cornerUpLeft, color: '#BA7517' },
                        { to: '/app/control-escolar/calificaciones', label: 'Ver historial', icon: Icons.history, color: '#534AB7' },
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
                <Link
                    to="/app/control-escolar/reportes"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{Icons.download}</span> Exportar
                </Link>
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard icon={Icons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Grupos en captura" value={loading && !payload ? '…' : formatNum(metricas.grupos_en_captura)} trend={metricas.ciclo_label ?? 'Ciclo activo'} trendColor="#185FA5" />
                <MetricCard icon={Icons.trendingUp} iconBg="#DCFCE7" iconColor="#0F6E56" title="Avance global" value={loading && !payload ? '…' : `${avanceGlobal}%`} trend="Captura en alcance operativo" trendColor="#0F6E56" />
                <MetricCard icon={Icons.hourglass} iconBg="#FEF3C7" iconColor="#BA7517" title="Pendientes de captura" value={loading && !payload ? '…' : formatNum(metricas.pendientes_captura)} trend="Por cerrar periodo" trendColor="#BA7517" />
                <MetricCard icon={Icons.messageSquare} iconBg="#EEEDFE" iconColor="#534AB7" title="Correcciones solicitadas" value={loading && !payload ? '…' : formatNum(metricas.correcciones_solicitadas)} trend="En flujo con Dirección" trendColor="#534AB7" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
                
                <div style={surface}>
                    <p style={surfaceTitle}>Avance de captura</p>
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Progreso global</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>{avanceGlobal}%</span>
                        </div>
                        <div style={{ height: 8, width: '100%', background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, avanceGlobal))}%`, background: '#0F6E56', borderRadius: 4 }} />
                        </div>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 1.4 }}>
                            {avanceDescripcion || `${avanceGlobal}% de las calificaciones han sido capturadas en el alcance operativo.`}
                        </p>
                    </div>
                </div>

                <div style={surface}>
                    <p style={surfaceTitle}>Estado por Grupos / Materias</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        {grupos.length === 0 && !loading ? (
                            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sin grupos con carga académica en tu alcance.</p>
                        ) : null}
                        {grupos.map((g, index) => (
                            <div key={`${g.grupo}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: index < grupos.length - 1 ? 12 : 0, borderBottom: index < grupos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{g.grupo}</p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{g.sede}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: (g.avance_pct ?? g.avancePct) === 100 ? '#0F6E56' : '#185FA5', margin: 0 }}>
                                        {g.avance_pct ?? g.avancePct ?? 0}% capturado
                                    </p>
                                    <p style={{ fontSize: 11, color: g.pendientes > 0 ? '#BA7517' : '#64748b', margin: '2px 0 0 0' }}>
                                        {g.pendientes} pendientes
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
                
                <div style={surface}>
                    <p style={surfaceTitle}>Acciones rápidas</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        <Link to="/app/importaciones" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#94a3b8' }}>›</span> Abrir importación académica
                        </Link>
                        <Link to="/app/observaciones" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#94a3b8' }}>›</span> Ver observaciones de captura
                        </Link>
                        <Link to="/app/expedientes" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#94a3b8' }}>›</span> Abrir expediente 360
                        </Link>
                    </div>
                </div>

                <div style={surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Calificaciones del grupo seleccionado
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {Icons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar alumno..."
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

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Alumno', 'Matrícula', 'Materia', 'Calificación', 'Estatus', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 10px',
                                                textAlign: h === 'Acciones' ? 'center' : 'left',
                                                fontSize: 12,
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
                                {loading && calificaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando calificaciones…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && calificaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay calificaciones en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : null}
                                {calificaciones.map((r, i) => (
                                    <tr
                                        key={r.matricula + r.materia}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div
                                                    style={{
                                                        ...avatarStyle(i),
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                    }}
                                                >
                                                    {initials(r.alumno)}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{r.matricula}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.materia}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 14, fontWeight: 700, color: r.calif === '—' || r.calif === '-' ? '#94a3b8' : '#0f172a' }}>
                                            {r.calif}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                <div title="Ver detalles" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', background: '#EFF6FF', cursor: 'pointer', flexShrink: 0 }}>
                                                    {Icons.eye}
                                                </div>
                                                <div title="Editar calificación" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', background: '#F8FAFC', cursor: 'pointer', flexShrink: 0 }}>
                                                    {Icons.pencil}
                                                </div>
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
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatNum(meta.total)} registros`
                                : `Total: ${formatNum(meta.total ?? 0)} registros`}
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

            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}