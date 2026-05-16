import React from 'react';
import { Link } from 'react-router-dom';
import { CE_DEMO_REPORTES_FRECUENTES } from '../../data/controlEscolarDemoData';

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
    const maxVal = Math.ceil(Math.max(...allValues) / 100) * 100;

    const xPos = (i) => padL + (i / (labels.length - 1)) * chartW;
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

// --- DATOS DEMO ---
const DEMO_REPORTES = [
    { nombre: 'Reporte de matrícula',       descripcion: 'Resumen de la matrícula total por programa, grado y grupo.',      fecha: '20/05/2025 09:30 a. m.', iconColor: '#185FA5', bg: '#DBEAFE' },
    { nombre: 'Reporte de reinscripciones', descripcion: 'Detalle de alumnos reinscritos por programa y periodo.',           fecha: '20/05/2025 09:15 a. m.', iconColor: '#0F6E56', bg: '#DCFCE7' },
    { nombre: 'Reporte de pendientes',      descripcion: 'Listado de pendientes por atender (documentos, pagos, trámites).', fecha: '20/05/2025 08:45 a. m.', iconColor: '#BA7517', bg: '#FEF3C7' },
    { nombre: 'Reporte de expedientes',     descripcion: 'Estatus de los expedientes por programa y estatus.',               fecha: '20/05/2025 08:30 a. m.', iconColor: '#534AB7', bg: '#EEEDFE' },
    { nombre: 'Reporte de trámites',        descripcion: 'Histórico de trámites realizados en el ciclo escolar.',            fecha: '20/05/2025 08:10 a. m.', iconColor: '#C2410C', bg: '#FFEDD5' },
];

const MESES = ['Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun','Jul'];

const TRAMITES_DATASETS = [
    { label: 'Inscripciones',   color: '#185FA5', strokeWidth: 2.5, data: [320, 280, 190, 120, 80,  60,  90,  140, 210, 290, 250, 310] },
    { label: 'Reinscripciones', color: '#0F6E56', strokeWidth: 2.5, dash: '6,3', data: [180, 520, 480, 350, 200, 150, 180, 240, 310, 480, 420, 490] },
    { label: 'Bajas y cambios', color: '#991B1B', strokeWidth: 2,   dash: '2,4', data: [30,  55,  70,  60,  40,  35,  45,  55,  65,  80,  70,  60]  },
];

export function ReportesCePage() {
    const reportes = (typeof CE_DEMO_REPORTES_FRECUENTES !== 'undefined' && CE_DEMO_REPORTES_FRECUENTES.length > 0)
        ? CE_DEMO_REPORTES_FRECUENTES
        : DEMO_REPORTES;

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
                    <span style={{ color: '#94a3b8' }}>{Icons.clock}</span> Actualizado: 20/05/2025 09:45 a. m.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { to: '#', label: 'Reporte de matrícula',       icon: Icons.users,         color: '#185FA5' },
                        { to: '#', label: 'Reporte de reinscripciones', icon: Icons.refreshCw,     color: '#0F6E56' },
                        { to: '#', label: 'Pendientes',                 icon: Icons.alertTriangle, color: '#BA7517' },
                        { to: '#', label: 'Exportar PDF',               icon: Icons.fileText,      color: '#991B1B' },
                        { to: '#', label: 'Exportar Excel',             icon: Icons.table,         color: '#0F6E56' },
                    ].map(({ to, label, icon, color }) => (
                        <Link key={label} to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a' }}>
                            <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
                <Link to="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a' }}>
                    <span style={{ color: '#185FA5', display: 'flex' }}>{Icons.filter}</span> Filtros
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                <MetricCard icon={Icons.users}         iconBg="#DBEAFE" iconColor="#185FA5" title="Matrícula total"            value="2,845" trend="7.4% vs. ciclo anterior"  trendUp={true}  />
                <MetricCard icon={Icons.refreshCw}     iconBg="#DCFCE7" iconColor="#0F6E56" title="Reinscripciones"            value="1,962" trend="6.2% vs. ciclo anterior"  trendUp={true}  />
                <MetricCard icon={Icons.userPlus}      iconBg="#FEF3C7" iconColor="#BA7517" title="Nuevas inscripciones"       value="883"   trend="12.8% vs. ciclo anterior" trendUp={true}  />
                <MetricCard icon={Icons.folder}        iconBg="#F3E8FF" iconColor="#534AB7" title="Expedientes completos"      value="2,112" trend="8.1% vs. ciclo anterior"  trendUp={true}  />
                <MetricCard icon={Icons.lock}          iconBg="#FEE2E2" iconColor="#991B1B" title="Reinscripciones bloqueadas" value="189"   trend="19.6% vs. ciclo anterior" trendUp={false} />
                <MetricCard icon={Icons.alertTriangle} iconBg="#FFEDD5" iconColor="#C2410C" title="Pendientes por atender"     value="158"   trend="14.7% vs. ciclo anterior" trendUp={false} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>

                <div style={surface}>
                    <p style={surfaceTitle}>Matrícula por programa</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', background: 'conic-gradient(#185FA5 0deg 113.4deg, #0F6E56 113.4deg 207.4deg, #BA7517 207.4deg 285.8deg, #534AB7 285.8deg 334.8deg, #e2e8f0 334.8deg 360deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>2,845</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Administración', val: '896', pct: '31.5%', color: '#185FA5' },
                                { label: 'Contabilidad',   val: '742', pct: '26.1%', color: '#0F6E56' },
                                { label: 'Informática',    val: '621', pct: '21.8%', color: '#BA7517' },
                                { label: 'Mercadotecnia',  val: '386', pct: '13.6%', color: '#534AB7' },
                                { label: 'Otros',          val: '200', pct: '7.0%',  color: '#e2e8f0' },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ color: '#475569', minWidth: 80 }}>{item.label}</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', width: 24, textAlign: 'right' }}>{item.val}</span>
                                    <span style={{ color: '#94a3b8', width: 32, textAlign: 'right' }}>{item.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="#" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>Ver detalle ›</Link>
                </div>
                            
                <div style={surface}>
                    <p style={surfaceTitle}>Expedientes por estatus</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
                        <div style={{ position: 'relative', width: 110, height: 110, borderRadius: '50%', background: 'conic-gradient(#0F6E56 0deg 267.1deg, #BA7517 267.1deg 333.3deg, #991B1B 333.3deg 353.4deg, #534AB7 353.4deg 360deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>2,845</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Completos',   val: '2,112', pct: '74.2%', color: '#0F6E56' },
                                { label: 'En revisión', val: '523',   pct: '18.4%', color: '#BA7517' },
                                { label: 'Incompletos', val: '158',   pct: '5.6%',  color: '#991B1B' },
                                { label: 'Observados',  val: '52',    pct: '1.8%',  color: '#534AB7' },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ color: '#475569', minWidth: 65 }}>{item.label}</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', width: 30, textAlign: 'right' }}>{item.val}</span>
                                    <span style={{ color: '#94a3b8', width: 32, textAlign: 'right' }}>{item.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="#" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>Ver detalle ›</Link>
                </div>

                
                <div style={surface}>
                    <p style={surfaceTitle}>Trámites por mes</p>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                        {TRAMITES_DATASETS.map(({ label, color, dash }) => (
                            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
                                <svg width="18" height="8" style={{ flexShrink: 0 }}>
                                    <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2.5" strokeDasharray={dash || 'none'} strokeLinecap="round" />
                                </svg>
                                {label}
                            </span>
                        ))}
                    </div>

                    <div style={{ flex: 1, minHeight: 130 }}>
                        <LineChart datasets={TRAMITES_DATASETS} labels={MESES} />
                    </div>

                    <Link to="#" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 12 }}>
                        Ver análisis ›
                    </Link>
                </div>

                <div style={surface}>
                    <p style={surfaceTitle}>Indicadores clave</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
                        {[
                            { label: 'Tasa de reinscripción',     value: '68.9%', width: '68.9%', barColor: '#534AB7', delta: '↑ 4.3 pp',  deltaUp: true  },
                            { label: 'Expedientes completos',      value: '74.2%', width: '74.2%', barColor: '#0F6E56', delta: '↑ 3.8 pp',  deltaUp: true  },
                            { label: 'Pendientes por atender',     value: '158',   width: '40%',   barColor: '#BA7517', delta: '↓ 14.7%',   deltaUp: false },
                            { label: 'Reinscripciones bloqueadas', value: '189',   width: '45%',   barColor: '#991B1B', delta: '↓ 19.6%',   deltaUp: false },
                        ].map(({ label, value, width, barColor, delta, deltaUp }) => (
                            <div key={label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{value}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ height: 6, flex: 1, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width, background: barColor, borderRadius: 4 }} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: deltaUp ? '#0F6E56' : '#991B1B', width: 40, textAlign: 'right' }}>
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
                            {reportes.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 6, background: r.bg, color: r.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {i === 0 ? Icons.users : i === 1 ? Icons.refreshCw : i === 2 ? Icons.alertTriangle : i === 3 ? Icons.folder : Icons.fileText}
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
                                            <Link to="#" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Generar</Link>
                                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
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