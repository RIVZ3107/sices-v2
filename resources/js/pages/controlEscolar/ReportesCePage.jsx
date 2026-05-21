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

const ICON_BY_KEY = {
    users: 'users',
    refreshCw: 'refreshCw',
    alertTriangle: 'alertTriangle',
    folder: 'folder',
    fileText: 'file',
    table: 'scrollText',
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
        return CeIcons[k] ?? CeIcons.file;
    };

    return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Reportes e indicadores</h1>
                    {CeIcons.shieldCheck}
                </div>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    <span style={{ color: '#94a3b8' }}>{CeIcons.clock}</span>
                    Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
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
                        { to: '/app/control-escolar/solicitudes', label: 'Pendientes', icon: CeIcons.alertTriangle, color: '#BA7517' },
                    ]).map(({ to, label, icon, color }) => (
                        <Link key={label} to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a' }}>
                            <span style={{ color, display: 'flex', alignItems: 'center' }}>{resolveIcon(icon)}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
                <Link to="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a' }}>
                    <span style={{ color: '#185FA5', display: 'flex' }}>{CeIcons.filter}</span> Filtros
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                <CeMetricCard icon={CeIcons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Matrícula total" value={formatCeNum(metricas.matricula_total)} trend={metricas.matricula_total_trend ?? '—'} trendUp={metricas.matricula_total_trend_up !== false} isNeutral />
                <CeMetricCard icon={CeIcons.refreshCw} iconBg="#DCFCE7" iconColor="#0F6E56" title="Reinscripciones" value={formatCeNum(metricas.reinscripciones)} trend={metricas.reinscripciones_trend ?? '—'} trendUp={metricas.reinscripciones_trend_up !== false} isNeutral />
                <CeMetricCard icon={CeIcons.userPlus} iconBg="#FEF3C7" iconColor="#BA7517" title="Nuevas inscripciones" value={formatCeNum(metricas.nuevas_inscripciones)} trend={metricas.nuevas_inscripciones_trend ?? '—'} trendUp={metricas.nuevas_inscripciones_trend_up !== false} isNeutral />
                <CeMetricCard icon={CeIcons.folder} iconBg="#F3E8FF" iconColor="#534AB7" title="Expedientes completos" value={formatCeNum(metricas.expedientes_completos)} trend={metricas.expedientes_completos_trend ?? '—'} trendUp={metricas.expedientes_completos_trend_up !== false} isNeutral />
                <CeMetricCard icon={CeIcons.lock} iconBg="#FEE2E2" iconColor="#991B1B" title="Reinscripciones bloqueadas" value={formatCeNum(metricas.reinscripciones_bloqueadas)} trend={metricas.reinscripciones_bloqueadas_trend ?? '—'} trendUp={metricas.reinscripciones_bloqueadas_trend_up === true} isNeutral />
                <CeMetricCard icon={CeIcons.alertTriangle} iconBg="#FFEDD5" iconColor="#C2410C" title="Pendientes por atender" value={formatCeNum(metricas.pendientes)} trend={metricas.pendientes_trend ?? '—'} trendUp={metricas.pendientes_trend_up === true} isNeutral />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>

                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Matrícula por programa</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', background: matriculaPrograma.conic_gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{formatCeNum(matriculaPrograma.total)}</span>
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

                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Expedientes por estatus</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', background: expedientesEstatus.conic_gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{formatCeNum(expedientesEstatus.total)}</span>
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

                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Trámites por mes</p>

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

                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Indicadores clave</p>
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

            <div style={ceTheme.surface}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>Reportes frecuentes</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Reporte', 'Descripción', 'Última generación', 'Formato', 'Acciones'].map((h) => (
                                    <th key={h} style={{ padding: '12px 10px', textAlign: h === 'Acciones' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: ceColors.pageBg }}>
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
                                                <span style={{ display: 'flex' }}>{CeIcons.download}</span> Descargar
                                            </Link>
                                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex' }}>{CeIcons.clock}</span> Programar
                                            </Link>
                                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                                <span style={{ display: 'flex' }}>{CeIcons.eye}</span> Ver
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