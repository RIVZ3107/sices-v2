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

// --- UTILIDADES DE ESTILO ---
function MetricCard({ icon, iconBg, iconColor, title, value, trend, trendUp, isNeutral }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: '220px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 10, marginTop: 4, color: isNeutral ? '#64748b' : (trendUp ? '#0F6E56' : '#991B1B'), fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {!isNeutral && (trendUp ? '↑ ' : '↓ ')}{trend}
                </p>
            </div>
        </div>
    );
}

// --- GRÁFICA SVG PURA ---
function LineChart({ datasets, labels }) {
    const W = 280;
    const H = 130;
    const padL = 28;
    const padR = 8;
    const padT = 10;
    const padB = 20;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const allValues = datasets.flatMap(d => d.data);
    const minVal = 0;
    const peak = allValues.length ? Math.max(...allValues) : 0;
    const maxVal = Math.max(100, Math.ceil(peak / 100) * 100);

    const xPos = (i) => padL + (labels.length > 1 ? (i / (labels.length - 1)) * chartW : chartW / 2);
    const yPos = (v) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    const toSmooth = (data) => {
        let d = '';
        for (let i = 0; i < data.length; i++) {
            const x = xPos(i);
            const y = yPos(data[i]);
            if (i === 0) {
                d += `M ${x.toFixed(1)},${y.toFixed(1)}`;
            } else {
                const px = xPos(i - 1);
                const py = yPos(data[i - 1]);
                const cp1x = (px + x) / 2;
                const cp2x = (px + x) / 2;
                d += ` C ${cp1x.toFixed(1)},${py.toFixed(1)} ${cp2x.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
            }
        }
        return d;
    };

    const yTicks = [];
    const step = maxVal / 4;
    for (let i = 0; i <= 4; i++) yTicks.push(Math.round(step * i));

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
            {/* Grid lines + etiquetas Y */}
            {yTicks.map((val) => (
                <g key={val}>
                    <line x1={padL} y1={yPos(val).toFixed(1)} x2={W - padR} y2={yPos(val).toFixed(1)} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={padL - 4} y={yPos(val) + 3} textAnchor="end" fontSize="7" fill="#94a3b8">
                        {val >= 1000 ? `${val / 1000}k` : val}
                    </text>
                </g>
            ))}

            {/* Líneas de datos */}
            {datasets.map((ds) => (
                <path
                    key={ds.label}
                    d={toSmooth(ds.data)}
                    fill="none"
                    stroke={ds.color}
                    strokeWidth={ds.strokeWidth || 2}
                    strokeDasharray={ds.dash || 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}

            {/* Puntos: inicio, fin y pico */}
            {datasets.map((ds) =>
                ds.data.map((v, i) => {
                    const isPeak = v === Math.max(...ds.data);
                    const isFirst = i === 0;
                    const isLast = i === ds.data.length - 1;
                    if (!isFirst && !isLast && !isPeak) return null;
                    return (
                        <circle
                            key={`${ds.label}-${i}`}
                            cx={xPos(i).toFixed(1)}
                            cy={yPos(v).toFixed(1)}
                            r="3"
                            fill={ds.color}
                            stroke="white"
                            strokeWidth="1.5"
                        />
                    );
                })
            )}

            {/* Etiquetas eje X (cada 2 meses) */}
            {labels.map((label, i) => {
                if (i % 2 !== 0 && i !== labels.length - 1) return null;
                return (
                    <text key={label} x={xPos(i).toFixed(1)} y={H - 4} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
                        {label}
                    </text>
                );
            })}
        </svg>
    );
}

// --- ICONOS ---
const Icons = {
    users: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    userPlus: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>),
    refreshCw: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>),
    alertTriangle: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>),
    lock: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>),
    folder: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>),
    fileText: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>),
    table: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" /><line x1="15" y1="9" x2="15" y2="21" /></svg>),
    download: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></svg>),
    clock: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
    eye: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
    shieldCheck: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" strokeWidth="2" /></svg>),
    filter: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>),
};

const ICON_BY_KEY = {
    users: 'users',
    refreshCw: 'refreshCw',
    alertTriangle: 'alertTriangle',
    folder: 'folder',
    fileText: 'fileText',
    table: 'table',
};

export function ReportesCePage() {
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.reportes();
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar los reportes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const metricas = payload?.metricas ?? {};
    const matriculaPrograma = payload?.matricula_por_programa ?? { total: 0, items: [], conic_gradient: 'conic-gradient(#e2e8f0 0deg 360deg)' };
    const expedientesEstatus = payload?.expedientes_por_estatus ?? { total: 0, items: [], conic_gradient: 'conic-gradient(#e2e8f0 0deg 360deg)' };
    const tramites = payload?.tramites_por_mes ?? { labels: [], datasets: [] };
    const indicadores = payload?.indicadores_clave ?? [];
    const reportes = payload?.reportes_frecuentes ?? [];
    const acciones = payload?.acciones_rapidas ?? [];

    const tramitesDatasets = (tramites.datasets ?? []).map((ds) => ({
        label: ds.label,
        color: ds.color,
        strokeWidth: ds.stroke_width ?? 2,
        dash: ds.dash ?? undefined,
        data: ds.data ?? [],
    }));

    const resolveIcon = (key) => {
        const k = ICON_BY_KEY[key] ?? key;
        return Icons[k] ?? Icons.fileText;
    };

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
        margin: '0 0 16px 0',
    };

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Reportes e indicadores</h1>
                    {Icons.shieldCheck}
                </div>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    <span style={{ color: '#94a3b8' }}>{Icons.clock}</span>
                    Actualizado: {loading && !payload ? '…' : formatActualizado(payload?.actualizado_en)}
                    {payload?.ciclo_label ? ` · Ciclo ${payload.ciclo_label}` : ''}
                </p>
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991B1B', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {(acciones.length ? acciones : [
                        { to: '/app/control-escolar/alumnos', label: 'Reporte de matrícula', icon: 'users', color: '#185FA5' },
                        { to: '/app/control-escolar/reinscripciones', label: 'Reporte de reinscripciones', icon: 'refreshCw', color: '#0F6E56' },
                        { to: '/app/control-escolar/solicitudes', label: 'Pendientes', icon: 'alertTriangle', color: '#BA7517' },
                    ]).map(({ to, label, icon, color }) => (
                        <Link key={label} to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a' }}>
                            <span style={{ color, display: 'flex', alignItems: 'center' }}>{resolveIcon(icon)}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
                <Link to="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a' }}>
                    <span style={{ color: '#185FA5', display: 'flex' }}>{Icons.filter}</span> Filtros
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                <MetricCard icon={Icons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Matrícula total" value={formatNum(metricas.matricula_total)} trend={metricas.matricula_total_trend ?? '—'} trendUp={metricas.matricula_total_trend_up !== false} isNeutral />
                <MetricCard icon={Icons.refreshCw} iconBg="#DCFCE7" iconColor="#0F6E56" title="Reinscripciones" value={formatNum(metricas.reinscripciones)} trend={metricas.reinscripciones_trend ?? '—'} trendUp={metricas.reinscripciones_trend_up !== false} isNeutral />
                <MetricCard icon={Icons.userPlus} iconBg="#FEF3C7" iconColor="#BA7517" title="Nuevas inscripciones" value={formatNum(metricas.nuevas_inscripciones)} trend={metricas.nuevas_inscripciones_trend ?? '—'} trendUp={metricas.nuevas_inscripciones_trend_up !== false} isNeutral />
                <MetricCard icon={Icons.folder} iconBg="#F3E8FF" iconColor="#534AB7" title="Expedientes completos" value={formatNum(metricas.expedientes_completos)} trend={metricas.expedientes_completos_trend ?? '—'} trendUp={metricas.expedientes_completos_trend_up !== false} isNeutral />
                <MetricCard icon={Icons.lock} iconBg="#FEE2E2" iconColor="#991B1B" title="Reinscripciones bloqueadas" value={formatNum(metricas.reinscripciones_bloqueadas)} trend={metricas.reinscripciones_bloqueadas_trend ?? '—'} trendUp={metricas.reinscripciones_bloqueadas_trend_up === true} isNeutral />
                <MetricCard icon={Icons.alertTriangle} iconBg="#FFEDD5" iconColor="#C2410C" title="Pendientes por atender" value={formatNum(metricas.pendientes)} trend={metricas.pendientes_trend ?? '—'} trendUp={metricas.pendientes_trend_up === true} isNeutral />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>

                <div style={surface}>
                    <p style={surfaceTitle}>Matrícula por programa</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', background: matriculaPrograma.conic_gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{formatNum(matriculaPrograma.total)}</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(matriculaPrograma.items ?? []).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ color: '#475569', minWidth: 80 }}>{item.label}</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', width: 24, textAlign: 'right' }}>{item.val}</span>
                                    <span style={{ color: '#94a3b8', width: 32, textAlign: 'right' }}>{item.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/control-escolar/alumnos" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>Ver detalle ›</Link>
                </div>

                <div style={surface}>
                    <p style={surfaceTitle}>Expedientes por estatus</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', background: expedientesEstatus.conic_gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{formatNum(expedientesEstatus.total)}</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(expedientesEstatus.items ?? []).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ color: '#475569', minWidth: 65 }}>{item.label}</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', width: 30, textAlign: 'right' }}>{item.val}</span>
                                    <span style={{ color: '#94a3b8', width: 32, textAlign: 'right' }}>{item.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/control-escolar/expedientes" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>Ver detalle ›</Link>
                </div>

                <div style={surface}>
                    <p style={surfaceTitle}>Trámites por mes</p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
    {tramitesDatasets.map(({ label, color, dash }) => (
        <span
            key={label}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                color: '#64748b'
            }}
        >
            <svg width="18" height="8" style={{ flexShrink: 0 }}>
                <line
                    x1="0"
                    y1="4"
                    x2="18"
                    y2="4"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeDasharray={dash || 'none'}
                    strokeLinecap="round"
                />
            </svg>
            {label}
        </span>
    ))}
</div>

<div style={{ flex: 1, minHeight: 130 }}>
    <LineChart
        datasets={tramitesDatasets}
        labels={tramites.labels ?? []}
    />
</div>

                    <Link to="#" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 12 }}>
                        Ver análisis ›
                    </Link>
                </div>

                <div style={surface}>
                    <p style={surfaceTitle}>Indicadores clave</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                        {indicadores.map(({ label, value, width, bar_color, delta, delta_up }) => (
                            <div key={label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{value}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ height: 6, flex: 1, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width, background: bar_color, borderRadius: 4 }} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: delta_up ? '#0F6E56' : '#991B1B', width: 72, textAlign: 'right' }}>
                                        {delta}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="#" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver todos los indicadores ›
                    </Link>
                </div>

            </div>

            <div style={surface}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>Reportes frecuentes</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Reporte', 'Descripción', 'Última generación', 'Formato', 'Acciones'].map((h) => (
                                    <th key={h} style={{ padding: '12px 10px', textAlign: h === 'Acciones' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && reportes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                                        Cargando reportes…
                                    </td>
                                </tr>
                            ) : null}
                            {!loading && reportes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                                        No hay reportes configurados en tu alcance.
                                    </td>
                                </tr>
                            ) : null}
                            {reportes.map((r, i) => (
                                <tr key={r.nombre ?? i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 6, background: r.bg, color: r.icon_color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {resolveIcon(r.icon)}
                                            </div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>{r.nombre}</p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 10px', fontSize: 12, color: '#475569' }}>{r.descripcion}</td>
                                    <td style={{ padding: '14px 10px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{r.fecha}</td>
                                    <td style={{ padding: '14px 10px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#991B1B', border: '1px solid #FECACA', padding: '2px 6px', borderRadius: 4 }}>PDF</span>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#0F6E56', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: 4 }}>XLSX</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            <Link to={r.ruta ?? '/app/control-escolar/reportes'} style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Generar</Link>
                                            <Link to={r.ruta ?? '/app/control-escolar/reportes'} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex' }}>{Icons.download}</span> Descargar
                                            </Link>
                                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex' }}>{Icons.clock}</span> Programar
                                            </Link>
                                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex' }}>{Icons.eye}</span> Ver
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}