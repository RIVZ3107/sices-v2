import React from 'react';
import { Link } from 'react-router-dom';
import { CE_DEMO_ERRORES_IMPORT, CE_DEMO_IMPORTACIONES } from '../../data/controlEscolarDemoData';

// --- UTILIDADES DE ESTILO (PALETA UNIFICADA BASE) ---
function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'prevalidada': { background: '#EAF3DE', color: '#3B6D11' },    // Verde pastel
        'completada': { background: '#EAF3DE', color: '#3B6D11' },     // Verde pastel
        'con errores': { background: '#FEE2E2', color: '#991B1B' },    // Rojo pastel
        'pendiente': { background: '#FEF3C7', color: '#BA7517' },      // Naranja pastel
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
    folder: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    checkCircle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    alertTriangle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    clock: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    plus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    upload: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
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
    filter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    download: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    ),
    xIcon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
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
};

const DEMO_ERRORES_IMPORT = [
    { label: 'Formato de fecha inválido', n: '18' },
    { label: 'CURP no coincide', n: '12' },
    { label: 'Falta calificación', n: '8' },
    { label: 'Materia no inscrita', n: '5' },
];

const DEMO_IMPORTACIONES = [
    { folio: 'IMP-2025-0012', archivo: 'calificaciones_301A.csv', alumno: 'Varios (Grupo 301-A)', registros: 45, errores: 0, estado: 'Prevalidada' },
    { folio: 'IMP-2025-0011', archivo: 'bajas_abril.xlsx', alumno: 'Varios', registros: 12, errores: 3, estado: 'Con errores' },
    { folio: 'IMP-2025-0010', archivo: 'kardex_historico.csv', alumno: 'José Andrés Martínez', registros: 48, errores: 0, estado: 'Completada' },
    { folio: 'IMP-2025-0009', archivo: 'altas_extemporaneas.xlsx', alumno: 'Varios', registros: 5, errores: 1, estado: 'Pendiente' },
];

export function ImportacionesCePage() {
    const errores = (typeof CE_DEMO_ERRORES_IMPORT !== 'undefined' && CE_DEMO_ERRORES_IMPORT.length > 0) ? CE_DEMO_ERRORES_IMPORT : DEMO_ERRORES_IMPORT;
    const rows = (typeof CE_DEMO_IMPORTACIONES !== 'undefined' && CE_DEMO_IMPORTACIONES.length > 0) ? CE_DEMO_IMPORTACIONES : DEMO_IMPORTACIONES;
        
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
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Importaciones académicas</h1>
                        {Icons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Calificaciones, kardex y altas masivas. Sin confirmación con errores críticos abiertos.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        🕐 Actualizado: 20/05/2025 09:45 a. m.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '/app/importaciones', label: 'Nueva importación', icon: Icons.plus, color: '#185FA5' },
                        { to: '/app/importaciones', label: 'Subir archivo', icon: Icons.upload, color: '#0F6E56' },
                        { to: '/app/importaciones', label: 'Prevalidar', icon: Icons.check, color: '#BA7517' },
                        { to: '/app/importaciones', label: 'Conciliar', icon: Icons.arrowsLeftRight, color: '#534AB7' },
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
                    to="/app/importaciones"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#991B1B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </span> 
                    Ver errores
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard 
                    icon={Icons.folder} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Importaciones recientes" value="24" 
                    trend="Últimos 30 días" trendColor="#185FA5" 
                />
                <MetricCard 
                    icon={Icons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Prevalidadas" value="11" 
                    trend="Listas para conciliar" trendColor="#0F6E56" 
                />
                <MetricCard 
                    icon={Icons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Con errores" value="5" 
                    trend="Requieren corrección" trendColor="#991B1B" 
                />
                <MetricCard 
                    icon={Icons.clock} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Pendientes" value="7" 
                    trend="En cola operativa" trendColor="#BA7517" 
                />
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                    No se permite <strong style={{ fontWeight: 600 }}>confirmar</strong> una importación mientras existan <strong style={{ fontWeight: 600 }}>errores críticos</strong> sin corregir.
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={surface}>   
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Historial de importaciones <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {Icons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar archivo o folio..."
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
                                <span style={{ display: 'flex', alignItems: 'center', color: '#185FA5' }}>{Icons.filter}</span> Filtros
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Archivo / Origen', 'Alumno / Programa', 'Registros', 'Errores', 'Estado', 'Acciones'].map((h) => (
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
                                {rows.map((r, i) => (
                                    <tr
                                        key={i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                                            <Link to="#" style={{ color: '#185FA5', textDecoration: 'none' }}>{r.folio}</Link>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.archivo}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.alumno}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.registros}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: r.errores > 0 ? 700 : 500, color: r.errores > 0 ? '#991B1B' : '#64748b' }}>
                                            {r.errores}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.estado}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, color: '#185FA5', bg: 'white', border: '#e2e8f0', title: 'Ver detalle' },
                                                    { icon: Icons.download, color: '#0F6E56', bg: 'white', border: '#e2e8f0', title: 'Descargar log' },
                                                    { icon: Icons.xIcon, color: '#991B1B', bg: '#FEE2E2', border: '#FEE2E2', title: 'Eliminar' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        title={btn.title}
                                                        style={{ 
                                                            width: 26, height: 26, borderRadius: 6, 
                                                            background: btn.bg, border: `1px solid ${btn.border}`, 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            color: btn.color, cursor: 'pointer', flexShrink: 0
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
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 4 de 24 importaciones</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['<', '1', '2', '3', '>'].map((p, idx) => (
                                <button
                                    key={idx}
                                    style={{
                                        minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                        border: p === '1' ? 'none' : '1px solid #e2e8f0',
                                        background: p === '1' ? '#185FA5' : 'white',
                                        color: p === '1' ? 'white' : '#475569',
                                        fontSize: 13, cursor: 'pointer',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={surface}>
                        <p style={surfaceTitle}>Errores frecuentes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                            {errores.map((e, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: i < errores.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <span style={{ fontSize: 13, color: '#475569' }}>{e.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>{e.n}</span>
                                </div>
                            ))}
                        </div>
                        <Link to="#" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                            Ver todos los errores ›
                        </Link>
                    </div>

                    <div style={surface}>
                        <p style={surfaceTitle}>Flujo de importación</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                            {[
                                { num: 1, color: '#185FA5', title: 'Carga de archivo', desc: 'Selección de plantilla y subida.' },
                                { num: 2, color: '#BA7517', title: 'Prevalidación', desc: 'Sintáctica y de catálogos.' },
                                { num: 3, color: '#534AB7', title: 'Conciliación', desc: 'Cruce con expedientes y trayectoria.' },
                                { num: 4, color: '#0F6E56', title: 'Confirmación', desc: 'Bloqueada si hay errores críticos.' }
                            ].map((step) => (
                                <div key={step.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                                        {step.num}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{step.title}</p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
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