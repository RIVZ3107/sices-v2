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

function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'activo': { background: '#EAF3DE', color: '#3B6D11' },
        'aprobada': { background: '#EAF3DE', color: '#3B6D11' },
        'estable': { background: '#EAF3DE', color: '#3B6D11' },
        
        'bueno': { background: '#DBEAFE', color: '#185FA5' },
        
        'en curso': { background: '#FAEEDA', color: '#854F0B' },
        'pendiente': { background: '#FAEEDA', color: '#854F0B' },
        
        'reprobada': { background: '#FEE2E2', color: '#991B1B' },
        'alto': { background: '#FEE2E2', color: '#991B1B' },
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

function TrayectoriaMetricCard({ icon, iconBg, iconColor, title, value, subValue, bottomType, progressPercent, badgeText }) {
    return (
        <div
            style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
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
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{title}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, marginTop: 6, color: '#64748b' }}>{subValue}</p>
                
                {bottomType === 'progress' && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: iconColor, borderRadius: 2 }} />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'right', marginTop: 4, margin: 0 }}>
                            {progressPercent}%
                        </p>
                    </div>
                )}
                
                {bottomType === 'badge' && (
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <StatusBadge>{badgeText}</StatusBadge>
                    </div>
                )}
            </div>
        </div>
    );
}

const Icons = {
    graduationCap: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
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
    history: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <polyline points="12 7 12 12 15 15" />
        </svg>
    ),
    arrowsLeftRight: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="9" x2="20" y2="9" />
            <polyline points="16 5 20 9 16 13" />
            <line x1="20" y1="15" x2="4" y2="15" />
            <polyline points="8 11 4 15 8 19" />
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
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    bookOpen: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    star: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    hourglass: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 2H6v6l4 4-4 4v6h12v-6l-4-4 4-4V2z" />
        </svg>
    ),
    alertTriangle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    refreshCw: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
    filter: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    clock: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
};

export function TrayectoriaCePage() {
    const [search, setSearch] = useState('');
    const [alumnoId, setAlumnoId] = useState(null);
    const [periodo, setPeriodo] = useState('Todos los periodos');
    const [historialSearch, setHistorialSearch] = useState('');
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.trayectoria({
                search: search.trim() || undefined,
                alumno_id: alumnoId ?? undefined,
                periodo: periodo !== 'Todos los periodos' ? periodo : undefined,
                historial_search: historialSearch.trim() || undefined,
            });
            setPayload(res?.data ?? null);
            if (res?.data?.alumno?.alumno_id && !alumnoId) {
                setAlumnoId(res.data.alumno.alumno_id);
            }
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar la trayectoria académica.');
        } finally {
            setLoading(false);
        }
    }, [search, alumnoId, periodo, historialSearch]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    const alumno = payload?.alumno;
    const metricas = payload?.metricas ?? {};
    const avanceCurricular = payload?.avance_curricular ?? { pct: 0, aprobados: 0, pendientes: 0 };
    const materiasResumen = payload?.materias_resumen ?? { total: 0, aprobadas: 0, reprobadas: 0, en_curso: 0, pct_aprobadas: 0, pct_reprobadas: 0, pct_en_curso: 0 };
    const avanceSemestre = payload?.avance_por_semestre ?? [];
    const alertas = payload?.alertas ?? [];
    const historial = payload?.historial?.data ?? [];
    const periodos = payload?.historial?.periodos ?? ['Todos los periodos'];
    const sugerencias = payload?.sugerencias ?? [];

    const pctAvance = Number(avanceCurricular.pct) || 0;
    const degAvance = pctAvance * 3.6;
    const pctApr = Number(materiasResumen.pct_aprobadas) || 0;
    const pctRep = Number(materiasResumen.pct_reprobadas) || 0;
    const pctCurso = Number(materiasResumen.pct_en_curso) || 0;
    const degApr = pctApr * 3.6;
    const degRep = degApr + pctRep * 3.6;

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
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Trayectoria académica</h1>
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
                        { to: '/app/control-escolar/trayectoria', label: 'Consultar kardex', icon: Icons.clock, color: '#185FA5' },
                        { to: '/app/control-escolar/documentos', label: 'Generar constancia', icon: Icons.fileText, color: '#534AB7' },
                        { to: '/app/control-escolar/trayectoria', label: 'Ver historial', icon: Icons.history, color: '#185FA5' },
                        { to: '/app/control-escolar/trayectoria', label: 'Equivalencias', icon: Icons.arrowsLeftRight, color: '#185FA5' },
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

            <div style={{ ...surface, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>

                    <div style={{ flex: '1 1 250px' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Selecciona un alumno</p>
                        <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 350 }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                {Icons.search}
                            </span>
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setAlumnoId(null);
                                }}
                                placeholder="Buscar por nombre, matrícula o CURP..."
                                style={{
                                    height: 40, width: '100%',
                                    paddingLeft: 36, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, color: '#0f172a', background: 'white',
                                    outline: 'none',
                                }}
                            />
                            {sugerencias.length > 0 && search.trim() ? (
                                <ul style={{
                                    position: 'absolute', top: 44, left: 0, right: 0, zIndex: 10,
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                                    listStyle: 'none', margin: 0, padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}>
                                    {sugerencias.map((s) => (
                                        <li key={s.alumno_id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAlumnoId(s.alumno_id);
                                                    setSearch(s.nombre);
                                                }}
                                                style={{
                                                    width: '100%', textAlign: 'left', padding: '10px 12px',
                                                    border: 'none', background: 'white', cursor: 'pointer', fontSize: 13,
                                                }}
                                            >
                                                <strong style={{ color: '#0f172a' }}>{s.nombre}</strong>
                                                <span style={{ color: '#64748b', marginLeft: 8 }}>{s.matricula}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    </div>

                    {alumno ? (
                    <div style={{ flex: '2 1 450px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderLeft: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DBEAFE', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                                    {initials(alumno.nombre)}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, background: '#3B6D11', border: '2px solid white', borderRadius: '50%' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>{alumno.nombre}</p>
                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                                    <span>Matrícula: <strong style={{ color: '#475569', fontWeight: 500 }}>{alumno.matricula}</strong></span>
                                    <span>CURP: <strong style={{ color: '#475569', fontWeight: 500 }}>{alumno.curp}</strong></span>
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', marginTop: 4, alignItems: 'center' }}>
                                    <span>Programa: {alumno.programa}</span>
                                    <span>Semestre: {alumno.semestre || '6°'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Estatus: <StatusBadge>{alumno.estatus}</StatusBadge>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            type="button"
                            onClick={() => {
                                setAlumnoId(null);
                                setSearch('');
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#185FA5', cursor: 'pointer' }}
                        >
                            <span style={{ display: 'flex' }}>{Icons.refreshCw}</span> Cambiar alumno
                        </button>
                    </div>
                    ) : (
                        <p style={{ flex: '2 1 450px', fontSize: 13, color: '#64748b', margin: 0, padding: '0 16px' }}>
                            {loading ? 'Cargando…' : 'Busca un alumno por nombre, matrícula o CURP para ver su trayectoria.'}
                        </p>
                    )}

                </div>
            </div>

            {alumno ? (
            <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <TrayectoriaMetricCard 
                    icon={Icons.bookOpen} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Créditos aprobados" value={formatNum(metricas.creditos_aprobados)} subValue={`de ${formatNum(metricas.creditos_totales)} créditos totales`} 
                    bottomType="progress" progressPercent={pctAvance} 
                />
                <TrayectoriaMetricCard 
                    icon={Icons.star} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Promedio general" value={metricas.promedio ?? '—'} subValue="Escala 0 - 10" 
                    bottomType="badge" badgeText={metricas.promedio_badge ?? '—'} 
                />
                <TrayectoriaMetricCard 
                    icon={Icons.hourglass} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Materias pendientes" value={formatNum(metricas.materias_pendientes)} subValue={`${formatNum(metricas.creditos_pendientes)} créditos pendientes`} 
                    bottomType="badge" badgeText={metricas.pendientes_badge ?? '—'} 
                />
                <TrayectoriaMetricCard 
                    icon={Icons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Riesgo académico" value={metricas.riesgo ?? '—'} subValue={metricas.riesgo_sub ?? ''} 
                    bottomType="badge" badgeText={metricas.riesgo_badge ?? '—'} 
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                
                <div style={surface}>
                    <p style={{...surfaceTitle, fontSize: 13, paddingBottom: 8 }}>Avance curricular</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 20, paddingTop: 10 }}>
                        <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(#0F6E56 0deg ${degAvance}deg, #e2e8f0 ${degAvance}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{pctAvance}%</span>
                                <span style={{ fontSize: 9, color: '#64748b' }}>Avance total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F6E56', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>Aprobado</p>
                                    <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{formatNum(avanceCurricular.aprobados)} créditos</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>Pendiente</p>
                                    <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{formatNum(avanceCurricular.pendientes)} créditos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={surface}>
                    <p style={{...surfaceTitle, fontSize: 13, paddingBottom: 8 }}>Materias aprobadas / reprobadas</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 20, paddingTop: 10 }}>
                        <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(#0F6E56 0deg ${degApr}deg, #991B1B ${degApr}deg ${degRep}deg, #BA7517 ${degRep}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{formatNum(materiasResumen.total)}</span>
                                <span style={{ fontSize: 9, color: '#64748b' }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F6E56', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', margin: 0 }}>Aprobadas</p>
                                    <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{formatNum(materiasResumen.aprobadas)} ({materiasResumen.pct_aprobadas}%)</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#991B1B', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', margin: 0 }}>Reprobadas</p>
                                    <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{formatNum(materiasResumen.reprobadas)} ({materiasResumen.pct_reprobadas}%)</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#BA7517', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', margin: 0 }}>En curso</p>
                                    <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{formatNum(materiasResumen.en_curso)} ({materiasResumen.pct_en_curso}%)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={surface}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{...surfaceTitle, fontSize: 13, paddingBottom: 8, border: 'none', margin: 0 }}>Avance por semestre</p>
                        <div style={{ display: 'flex', gap: 10, fontSize: 9, color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, background: '#185FA5' }} /> Aprobados</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, background: '#e2e8f0' }} /> Pendientes</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', height: 100, alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontSize: 9, color: '#94a3b8', paddingRight: 8 }}>
                            <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                        </div>
                        {(avanceSemestre.length > 0 ? avanceSemestre : [{ semestre: 1, pct: 0 }]).map((item) => (
                            <div key={item.semestre} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{ width: '100%', maxWidth: 16, height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'flex-end', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
                                    <div style={{ width: '100%', height: `${item.pct}%`, background: '#185FA5' }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{item.semestre}°</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 10, color: '#64748b', textAlign: 'center', margin: '4px 0 0 0' }}>
                        Semestre actual: {payload?.semestre_actual ?? alumno?.semestre ?? '—'}
                    </p>
                </div>

                <div style={surface}>
                    <p style={{...surfaceTitle, fontSize: 13, paddingBottom: 8 }}>
                        Alertas académicas
                        <Link to="#" style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todas</Link>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {alertas.length === 0 ? (
                            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Sin alertas académicas activas.</p>
                        ) : alertas.map((a, i) => {
                            const iconColor = a.tipo === 'warning' ? '#BA7517' : a.tipo === 'doc' ? '#534AB7' : '#185FA5';
                            const icon = a.tipo === 'doc' ? Icons.fileText : a.tipo === 'warning' ? Icons.alertTriangle : Icons.history;
                            return (
                                <div
                                    key={`${a.titulo}-${i}`}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                                        borderBottom: i < alertas.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        paddingBottom: i < alertas.length - 1 ? 8 : 0,
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ color: iconColor, marginTop: 2 }}>{icon}</span>
                                        <div>
                                            <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', margin: 0 }}>{a.titulo}</p>
                                            <p style={{ fontSize: 10, color: '#64748b', margin: '2px 0 0 0' }}>{a.desc}</p>
                                        </div>
                                    </div>
                                    <span style={{ color: '#94a3b8' }}>›</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={surface}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Historial de materias</h2>
                        <select
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            style={{ height: 34, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}
                        >
                            {periodos.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                {Icons.search}
                            </span>
                            <input
                                type="search"
                                value={historialSearch}
                                onChange={(e) => setHistorialSearch(e.target.value)}
                                placeholder="Buscar en la tabla..."
                                style={{
                                    height: 36, width: 220,
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
                                {['Clave', 'Materia', 'Periodo', 'Calificación ⇅', 'Créditos', 'Estatus', 'Acciones'].map((h) => (
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
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                            <tbody>
                                {loading && historial.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando historial…
                                        </td>
                                    </tr>
                                ) : historial.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay materias registradas para este alumno.
                                        </td>
                                    </tr>
                                ) : historial.map((m) => (
                                    <tr
                                        key={`${m.clave}-${m.periodo}-${m.nombre}`}
                                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '12px 10px', fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{m.clave}</td>
                                    <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{m.nombre}</td>
                                    <td style={{ padding: '12px 10px', fontSize: 13, color: '#475569' }}>{m.periodo}</td>
                                    <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 600, color: m.calificacion === '-' ? '#94a3b8' : (parseFloat(m.calificacion) >= 6 ? '#0F6E56' : '#991B1B') }}>
                                        {m.calificacion}
                                    </td>
                                    <td style={{ padding: '12px 10px', fontSize: 13, color: '#64748b' }}>{formatNum(m.creditos)}</td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <StatusBadge>{m.estatus}</StatusBadge>
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                                            <Link to={alumno?.expediente_url ?? '#'} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex', alignItems: 'center' }}>{Icons.eye}</span> Ver detalle
                                            </Link>
                                            <Link to={alumno?.expediente_url ?? '#'} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex', alignItems: 'center' }}>{Icons.history}</span> Expediente
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            ) : null}
                            
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}