import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    CE_DASHBOARD_ESTATUS_ALUMNOS,
    CE_DEMO_PROCESOS_RECIENTES,
    ceTotalAlumnosEstatus,
} from '../../data/controlEscolarDemoData';
import { useDashboardResumen } from './useDashboardResumen';

// --- UTILIDADES DE ESTILO (PALETA UNIFICADA BASE) ---
function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'completado': { background: '#EAF3DE', color: '#3B6D11' },    // Verde pastel
        'en proceso': { background: '#DBEAFE', color: '#185FA5' },    // Azul pastel
        'pendiente': { background: '#FEF3C7', color: '#BA7517' },     // Naranja pastel
        'observado': { background: '#EEEDFE', color: '#534AB7' },     // Morado pastel
        'error': { background: '#FEE2E2', color: '#991B1B' },         // Rojo pastel
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

function MetricCard({ icon, iconBg, iconColor, title, value, trend, tone }) {
    // Determinar color de tendencia basado en el tono original
    let trendColor = '#64748b';
    if (tone === 'blue') trendColor = '#185FA5';
    if (tone === 'green') trendColor = '#0F6E56';
    if (tone === 'red') trendColor = '#991B1B';
    if (tone === 'orange') trendColor = '#BA7517';
    if (tone === 'purple') trendColor = '#534AB7';

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
                minWidth: '220px',
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
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, marginTop: 6, color: trendColor, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

// --- ICONOS UNIFICADOS ---
const Icons = {
    userPlus: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    clipboardList: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <line x1="12" y1="11" x2="16" y2="11" />
            <line x1="12" y1="16" x2="16" y2="16" />
            <line x1="8" y1="11" x2="8.01" y2="11" />
            <line x1="8" y1="16" x2="8.01" y2="16" />
        </svg>
    ),
    refreshCw: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
    fileText: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    graduationCap: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    moreHorizontal: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    folder: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    alertTriangle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    lock: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    clock: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
};

// Función original para gráfica de dona
function buildDonutGradient() {
    const segs = CE_DASHBOARD_ESTATUS_ALUMNOS;
    const total = ceTotalAlumnosEstatus();

    if (!total) {
        return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }

    let acc = 0;

    const parts = segs.map((s) => {
        const start = acc;
        const span = (s.count / total) * 360;
        acc += span;

        return `${s.color} ${start}deg ${acc}deg`;
    });

    return `conic-gradient(${parts.join(', ')})`;
}

export function ControlEscolarDashboardPage() {
    const { error, fullPayload } = useDashboardResumen();

    const data = fullPayload;
    const loading = fullPayload === null && !error;
    const m = data?.metricas ?? {};

    const expedPend = Math.max(Number(m.matriculas_incompletas ?? 0), 12);
    const insVal = Math.max(Number(m.inscripciones_pendientes ?? 0), 28);
    const reinBloq = Math.max(Number(m.cargas_academicas_pendientes ?? 0), 14);
    const docGen = Math.max(Number(m.calificaciones_pendientes ?? 0), 18);
    const solCorr = Math.max(Number(m.documentos_con_observaciones ?? 0), 7);

    const misPendientes = useMemo(
        () => [
            {
                label: 'Inscripciones por validar',
                n: insVal,
                to: '/app/control-escolar/inscripciones',
            },
            {
                label: 'Reinscripciones bloqueadas',
                n: reinBloq,
                to: '/app/control-escolar/reinscripciones',
            },
            {
                label: 'Documentos por generar',
                n: docGen,
                to: '/app/control-escolar/documentos',
            },
            {
                label: 'Solicitudes de corrección',
                n: solCorr,
                to: '/app/control-escolar/solicitudes',
            },
            {
                label: 'Expedientes incompletos',
                n: expedPend,
                to: '/app/control-escolar/expedientes',
            },
        ],
        [insVal, reinBloq, docGen, solCorr, expedPend]
    );

    const procesos = useMemo(() => {
        if (Array.isArray(data?.documentos_en_proceso) && data.documentos_en_proceso.length > 0) {
            return data.documentos_en_proceso.map((r) => ({
                alumno: r.alumno ?? '—',
                matricula: r.matricula ?? '—',
                tramite: 'Seguimiento documental / expediente',
                fecha: new Date().toLocaleDateString('es-MX'),
                estatus: r.estado ?? 'En proceso',
            }));
        }

        return CE_DEMO_PROCESOS_RECIENTES;
    }, [data]);

    const totalDonut = ceTotalAlumnosEstatus();

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

    if (loading) {
        return (
            <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                    {Icons.shieldCheck}
                </div>
                <div style={surface}>
                    <p style={{ fontSize: 13, color: '#64748b' }}>Preparando tablero operativo de Control Escolar...</p>
                </div>
            </div>
        );
    }

    if (error && data === null) {
        return (
            <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                    {Icons.shieldCheck}
                </div>
                <div style={surface}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B' }}>Error de carga</p>
                    <p style={{ fontSize: 13, color: '#991B1B' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* ── Header Layout ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                        {Icons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Operación académica escolar para Educación Normal y UPN. La matrícula oficial la asigna Educación Superior; aquí se prepara expediente, inscripción, trayectoria y documentos operativos.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{Icons.clock}</span> Actualizado: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 13, color: '#92400E', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            {/* ── Action bar ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {[
                    { to: '/app/alumnos/crear', label: 'Nuevo alumno', icon: Icons.userPlus, color: '#185FA5' },
                    { to: '/app/control-escolar/inscripciones', label: 'Nueva inscripción', icon: Icons.clipboardList, color: '#0F6E56' },
                    { to: '/app/control-escolar/reinscripciones', label: 'Reinscribir alumno', icon: Icons.refreshCw, color: '#0F6E56' },
                    { to: '/app/control-escolar/documentos', label: 'Generar constancia', icon: Icons.fileText, color: '#534AB7' },
                    { to: '/app/control-escolar/trayectoria', label: 'Kardex', icon: Icons.graduationCap, color: '#BA7517' },
                    { to: '/app/control-escolar/solicitudes', label: 'Más opciones', icon: Icons.moreHorizontal, color: '#64748b' },
                ].map(({ to, label, icon, color }) => (
                    <Link
                        key={label}
                        to={to}
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

            {/* ── Metrics Row ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                <MetricCard icon={Icons.folder} iconBg="#DBEAFE" iconColor="#185FA5" title="Expedientes pendientes" value={expedPend} trend="↓ 6% vs. ciclo anterior" tone="blue" />
                <MetricCard icon={Icons.clipboardList} iconBg="#DCFCE7" iconColor="#0F6E56" title="Inscripciones por validar" value={insVal} trend="↑ 4% vs. ciclo anterior" tone="green" />
                <MetricCard icon={Icons.lock} iconBg="#FEE2E2" iconColor="#991B1B" title="Reinscripciones bloqueadas" value={reinBloq} trend="↑ 2% vs. ciclo anterior" tone="red" />
                <MetricCard icon={Icons.fileText} iconBg="#F3E8FF" iconColor="#6B21A8" title="Documentos por generar" value={docGen} trend="↓ 3% vs. ciclo anterior" tone="purple" />
                <MetricCard icon={Icons.alertTriangle} iconBg="#FEF3C7" iconColor="#BA7517" title="Solicitudes de corrección" value={solCorr} trend="↑ 1% vs. ciclo anterior" tone="orange" />
            </div>

            {/* ── Main Grid (3 Columnas) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
                
                {/* Col 1: Mis pendientes */}
                <div style={surface}>
                    <div style={surfaceTitle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Mis pendientes</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {misPendientes.map((p) => (
                            <li
                                key={p.label}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}
                            >
                                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{p.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.n}</span>
                                    <Link to={p.to} style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', textDecoration: 'none', background: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                                        Ir
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/control-escolar/expedientes" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver todos mis pendientes ›
                    </Link>
                </div>

                {/* Col 2: Alumnos por estatus */}
                <div style={surface}>
                    <p style={surfaceTitle}>Alumnos por estatus</p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '10px 0' }}>
                        
                        {/* Donut Chart */}
                        <div style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', background: buildDonutGradient(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                                    {totalDonut.toLocaleString('es-MX')}
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>Total</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                            {CE_DASHBOARD_ESTATUS_ALUMNOS.map((r) => (
                                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                                        <span style={{ color: '#475569', fontWeight: 500 }}>{r.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', width: 40 }}>{r.count.toLocaleString('es-MX')}</span>
                                        <span style={{ color: '#94a3b8', textAlign: 'right', width: 40 }}>({r.pct}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/control-escolar/alumnos" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver reporte completo ›
                    </Link>
                </div>

                {/* Col 3: Procesos recientes */}
                <div style={surface}>
                    <div style={surfaceTitle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Procesos recientes</span>
                    </div>
                    <div style={{ overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px 4px 12px 0', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Alumno</th>
                                    <th style={{ padding: '8px 4px 12px 4px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Estatus</th>
                                    <th style={{ padding: '8px 0 12px 4px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {procesos.slice(0, 6).map((row, idx) => (
                                    <tr key={`${row.alumno}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '10px 4px 10px 0' }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                                                {row.alumno}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>
                                                {row.matricula}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 4px' }}>
                                            <StatusBadge>{row.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '10px 0 10px 4px', textAlign: 'right' }}>
                                            <Link
                                                to="/app/control-escolar/expedientes"
                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'white', border: '1px solid #e2e8f0', color: '#185FA5', textDecoration: 'none' }}
                                                title="Ver detalle"
                                            >
                                                {Icons.eye}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Link to="/app/control-escolar/solicitudes" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver todos los procesos ›
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}