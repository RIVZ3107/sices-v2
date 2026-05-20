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

function formatFecha(iso) {
    if (!iso) return { date: '—', time: '' };
    try {
        const d = new Date(iso);
        return {
            date: new Intl.DateTimeFormat('es-MX', { dateStyle: 'short' }).format(d),
            time: new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' }).format(d),
        };
    } catch {
        return { date: '—', time: '' };
    }
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
        'confirmada': { background: '#EAF3DE', color: '#3B6D11' },     // Verde pastel
        'por validar': { background: '#FAEEDA', color: '#854F0B' },    // Naranja pastel
        'observada': { background: '#EEEDFE', color: '#534AB7' },      // Morado pastel
        'próximo': { background: '#FAEEDA', color: '#854F0B' },        // Naranja pastel
        'programado': { background: '#DBEAFE', color: '#185FA5' },     // Azul pastel
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
                {trend ? (
                    <p style={{ fontSize: 11, marginTop: 6, color: trendColor, fontWeight: 500 }}>
                        {trend}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

const Icons = {
    fileNew: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
    ),
    clock: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    checkCircle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    eyeBig: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    userPlus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    clipboardList: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <line x1="12" y1="11" x2="16" y2="11" />
            <line x1="12" y1="16" x2="16" y2="16" />
            <line x1="8" y1="11" x2="8.01" y2="11" />
            <line x1="8" y1="16" x2="8.01" y2="16" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    printer: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </svg>
    ),
    filter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    folder: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
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
    )
};

export function InscripcionesCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.inscripciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar el control de inscripciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const fechas = payload?.fechas_importantes ?? [];
    const reglaMatricula = payload?.regla_matricula ?? '';

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Control de inscripciones</h1>
                    {Icons.shieldCheck}
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
                        { to: '/app/expedientes?tab=ingreso', label: 'Nueva inscripción', icon: Icons.userPlus, color: '#0F6E56' },
                        { to: '/app/control-escolar/inscripciones', label: 'Validar documentos', icon: Icons.clipboardList, color: '#534AB7' },
                        { to: '/app/control-escolar/inscripciones', label: 'Confirmar inscripción', icon: Icons.check, color: '#0F6E56' },
                        { to: '/app/control-escolar/inscripciones', label: 'Imprimir comprobante', icon: Icons.printer, color: '#185FA5' },
                        { to: '/app/control-escolar/inscripciones?filtros=1', label: 'Filtros', icon: Icons.filter, color: '#64748b' },
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
                <p style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            {reglaMatricula ? (
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    {reglaMatricula}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard icon={Icons.fileNew} iconBg="#DBEAFE" iconColor="#185FA5" title="Inscripciones nuevas" value={formatNum(metricas.nuevas)} trend={`${formatNum(metricas.total_alcance)} en tu alcance`} trendColor="#64748b" />
                <MetricCard icon={Icons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Por validar" value={formatNum(metricas.por_validar)} />
                <MetricCard icon={Icons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Confirmadas" value={formatNum(metricas.confirmadas)} />
                <MetricCard icon={Icons.eyeBig} iconBg="#EEEDFE" iconColor="#534AB7" title="Observadas" value={formatNum(metricas.observadas)} />
            </div>
                        
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Inscripciones <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {Icons.search}
                                </span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Buscar por alumno, folio o programa..."
                                    style={{
                                        height: 36, width: 280,
                                        paddingLeft: 34, paddingRight: 12,
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        fontSize: 13, color: '#0f172a', background: 'white',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Alumno', 'Programa', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
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
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando inscripciones…
                                        </td>
                                    </tr>
                                ) : !loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay inscripciones en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : rows.map((r, i) => {
                                    const expedienteUrl = r.expediente_url ?? `/app/alumnos/${r.alumno_id}/expediente`;
                                    return (
                                    <tr
                                        key={r.folio ?? r.inscripcion_id ?? i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 500, color: '#64748b' }}>
                                            {r.folio}
                                        </td>
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
                                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.programa}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{formatFecha(r.fecha).date}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{formatFecha(r.fecha).time}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, title: 'Revisar', color: '#185FA5', bg: '#EFF6FF' },
                                                    { icon: Icons.clipboardList, title: 'Validar', color: '#534AB7', bg: '#F5F3FF' },
                                                    { icon: Icons.check, title: 'Confirmar', color: '#0F6E56', bg: '#F0FDF4' },
                                                    { icon: Icons.printer, title: 'Imprimir', color: '#185FA5', bg: '#F8FAFC' },
                                                    { icon: Icons.folder, title: 'Ver expediente', color: '#185FA5', bg: '#EFF6FF' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        title={btn.title}
                                                        style={{ 
                                                            width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            color: btn.color, background: btn.bg, cursor: 'pointer', flexShrink: 0 
                                                        }}
                                                    >
                                                        {btn.icon}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatNum(meta.total)} resultados`
                                : 'Sin resultados'}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
                                    opacity: page <= 1 || loading ? 0.5 : 1,
                                }}
                            >
                                «
                            </button>
                            <span style={{ alignSelf: 'center', fontSize: 13, color: '#475569', padding: '0 8px' }}>
                                {meta.current_page ?? page} / {meta.last_page ?? 1}
                            </span>
                            <button
                                type="button"
                                disabled={page >= (meta.last_page ?? 1) || loading}
                                onClick={() => setPage((p) => p + 1)}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: page >= (meta.last_page ?? 1) || loading ? 'not-allowed' : 'pointer',
                                    opacity: page >= (meta.last_page ?? 1) || loading ? 0.5 : 1,
                                }}
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={surface}>
                        <p style={surfaceTitle}>Pasos del proceso de inscripción</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                            {[
                                { num: 1, color: '#185FA5', title: 'Registro de datos', desc: 'Captura de información del aspirante.', icon: Icons.printer },
                                { num: 2, color: '#BA7517', title: 'Carga de documentos', desc: 'Subir y revisar documentos requeridos.', icon: Icons.fileText },
                                { num: 3, color: '#534AB7', title: 'Validación', desc: 'Revisión y validación de documentos.', icon: Icons.clipboardList },
                                { num: 4, color: '#0F6E56', title: 'Confirmación', desc: 'Confirmar la inscripción y generar comprobante.', icon: Icons.checkCircle }
                            ].map((step) => (
                                <div key={step.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                                        {step.num}
                                    </div>
                                    <div>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                            <span style={{ color: step.color }}>{step.icon}</span> {step.title}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={surface}>
                        <p style={surfaceTitle}>
                            Próximas fechas importantes
                            <Link to="/app/calendario" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                {Icons.calendar} Ver calendario
                            </Link>
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {fechas.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: i < fechas.length - 1 ? 16 : 0, borderBottom: i < fechas.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{f.fecha}</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{f.mes}</span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{f.titulo}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>{f.sub}</p>
                                        </div>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                        <StatusBadge>{f.badge}</StatusBadge>
                                    </div>
                                </div>
                            ))}
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