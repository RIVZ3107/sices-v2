import React from 'react';
import { Link } from 'react-router-dom';
import { CE_ACTIVIDAD_RECIENTE, CE_DOCUMENTOS_REQUERIDOS, CE_DEMO_EXPEDIENTES } from '../../data/controlEscolarDemoData';

function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'completo': { background: '#EAF3DE', color: '#3B6D11' },         
        'pendiente': { background: '#DBEAFE', color: '#185FA5' },        
        'con observaciones': { background: '#FAEEDA', color: '#854F0B' }, 
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
                fontWeight: 500,
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );
}

function MetricCard({ icon, iconBg, iconColor, title, value, trend, trendUp }) {
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
                <p style={{ fontSize: 11, marginTop: 6, color: trendUp ? '#0F6E56' : '#BA7517', fontWeight: 500 }}>
                    {trendUp ? '↑' : '↓'} {trend}
                </p>
            </div>
        </div>
    );
}

const Icons = {
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    folder: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    checkCircle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    fileText: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
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
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    pencil: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    checkSmall: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    xSmall: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
};

const DEMO_EXPEDIENTES = [
    { folio: 'EXP-2025-000123', alumno: 'María Fernanda López Ruiz', matricula: 'A23010245', programa: 'Licenciatura en Administración', actualizado: '20/05/2025 09:32 a. m.', usuario: 'por Usuario Escuela', estatus: 'Completo' },
    { folio: 'EXP-2025-000124', alumno: 'José Andrés Martínez Díaz', matricula: 'A23009876', programa: 'Ingeniería en Sistemas Computacionales', actualizado: '20/05/2025 09:15 a. m.', usuario: 'por Usuario Escuela', estatus: 'Con observaciones' },
    { folio: 'EXP-2025-000125', alumno: 'Ana Paula García Torres', matricula: 'A23011488', programa: 'Psicología', actualizado: '20/05/2025 08:47 a. m.', usuario: 'por Usuario Escuela', estatus: 'Pendiente' },
    { folio: 'EXP-2025-000126', alumno: 'Diego Alejandro Pérez Soto', matricula: 'A23010567', programa: 'Contador Público', actualizado: '20/05/2025 08:25 a. m.', usuario: 'por Usuario Escuela', estatus: 'Completo' },
    { folio: 'EXP-2025-000127', alumno: 'Valeria Hernández Cruz', matricula: 'A23011123', programa: 'Derecho', actualizado: '20/05/2025 08:03 a. m.', usuario: 'por Usuario Escuela', estatus: 'Con observaciones' },
];

const DEMO_DOCS = [
    { nombre: 'Acta de nacimiento', req: 'Obligatorio', comp: '2,680 (97%)', ok: true },
    { nombre: 'CURP', req: 'Obligatorio', comp: '2,742 (99%)', ok: true },
    { nombre: 'Certificado de bachillerato', req: 'Obligatorio', comp: '2,615 (95%)', ok: true },
    { nombre: 'Comprobante de domicilio', req: 'Obligatorio', comp: '2,301 (84%)', ok: false },
    { nombre: 'INE / Identificación oficial', req: 'Obligatorio', comp: '2,290 (83%)', ok: true },
    { nombre: 'Fotografía tamaño infantil', req: 'Opcional', comp: '2,640 (96%)', ok: true },
    { nombre: 'Carta de buena conducta', req: 'Opcional', comp: '1,342 (49%)', ok: false },
    { nombre: 'Comprobante de pago', req: 'Opcional', comp: '1,890 (69%)', ok: false },
];

const DEMO_ACT = [
    { type: 'upload', icon: Icons.upload, color: '#185FA5', bg: '#DBEAFE', title: 'Se cargó un documento en el expediente de', bold: 'María Fernanda López Ruiz', time: 'Hace 15 minutos' },
    { type: 'obs', icon: Icons.eye, color: '#534AB7', bg: '#EEEDFE', title: 'Se agregó una observación al expediente de', bold: 'José Andrés Martínez Díaz', time: 'Hace 32 minutos' },
    { type: 'check', icon: Icons.check, color: '#0F6E56', bg: '#DCFCE7', title: 'Se validó el expediente de', bold: 'Diego Alejandro Pérez Soto', time: 'Hace 1 hora' },
    { type: 'upload', icon: Icons.upload, color: '#185FA5', bg: '#DBEAFE', title: 'Se cargó un documento en el expediente de', bold: 'Ana Paula García Torres', time: 'Hace 2 horas' },
];

export function ExpedientesCePage() {
    const rows = (typeof CE_DEMO_EXPEDIENTES !== 'undefined' && CE_DEMO_EXPEDIENTES.length) ? CE_DEMO_EXPEDIENTES : DEMO_EXPEDIENTES;
    const documentos = (typeof CE_DOCUMENTOS_REQUERIDOS !== 'undefined' && CE_DOCUMENTOS_REQUERIDOS.length) ? CE_DOCUMENTOS_REQUERIDOS : DEMO_DOCS;
    const actividad = (typeof CE_ACTIVIDAD_RECIENTE !== 'undefined' && CE_ACTIVIDAD_RECIENTE.length) ? CE_ACTIVIDAD_RECIENTE : DEMO_ACT;

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

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Expedientes de alumnos</h1>
                    {Icons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        🕐 Actualizado: 20/05/2025 09:45 a. m.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { to: '/app/expedientes', label: 'Crear expediente', icon: Icons.userPlus, color: '#185FA5' },
                        { to: '/app/documentos/bandejas/por-rol', label: 'Cargar documento', icon: Icons.upload, color: '#0F6E56' },
                        { to: '/app/control-escolar/expedientes', label: 'Validar', icon: Icons.check, color: '#534AB7' },
                        { to: '/app/observaciones', label: 'Observar', icon: Icons.eye, color: '#BA7517' },
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
                    <span style={{ color: '#534AB7', display: 'flex' }}>{Icons.download}</span> Exportar
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard icon={Icons.folder} iconBg="#DBEAFE" iconColor="#185FA5" title="Expedientes pendientes" value="58" trend="18% vs. ciclo anterior" trendUp={true} />
                <MetricCard icon={Icons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Completos" value="1,842" trend="12% vs. ciclo anterior" trendUp={false} />
                <MetricCard icon={Icons.eyeBig} iconBg="#FEF3C7" iconColor="#BA7517" title="Con observaciones" value="126" trend="9% vs. ciclo anterior" trendUp={true} />
                <MetricCard icon={Icons.fileText} iconBg="#EEEDFE" iconColor="#534AB7" title="Documentos faltantes" value="312" trend="14% vs. ciclo anterior" trendUp={true} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Listado de expedientes</h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {Icons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar por alumno, folio o programa..."
                                    style={{
                                        height: 36, width: 320,
                                        paddingLeft: 34, paddingRight: 12,
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        fontSize: 13, color: '#0f172a', background: 'white',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <button style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 500, color: '#0f172a', cursor: 'pointer' }}>
                                <span style={{ color: '#185FA5', display: 'flex', alignItems: 'center' }}>{Icons.filter}</span> Filtros
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Alumno', 'Programa', 'Última actualización', 'Estatus', 'Acciones'].map((h) => (
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
                                {rows.map((r) => (
                                    <tr
                                        key={r.folio}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                                            {r.folio}
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula}</p>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, color: '#475569' }}>{r.programa}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{r.actualizado}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.usuario}</p>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <StatusBadge>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, color: '#185FA5', bg: '#EFF6FF' },
                                                    { icon: Icons.pencil, color: '#185FA5', bg: '#F8FAFC' },
                                                    { icon: Icons.upload, color: '#0F6E56', bg: '#DCFCE7' },
                                                    { icon: Icons.download, color: '#534AB7', bg: '#F5F3FF' },
                                                    { icon: Icons.check, color: '#0F6E56', bg: '#F0FDF4' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
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
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 8 de 58 expedientes</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['<', '1', '2', '3', '4', '5', '>'].map((p, idx) => (
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                                Mostrar 
                                <select style={{ height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 8px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}>
                                    <option>10</option>
                                    <option>25</option>
                                    <option>50</option>
                                </select> 
                                por página
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Paneles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Documentos Requeridos */}
                    <div style={surface}>
                        <p style={surfaceTitle}>
                            Documentos requeridos
                            <Link to="/app/documentos" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todos</Link>
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', paddingBottom: 8, borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                            <span>Documento</span>
                            <span style={{ textAlign: 'center' }}>Requerido</span>
                            <span style={{ textAlign: 'right' }}>Completado</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                            {documentos.map((d, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', alignItems: 'center', padding: '10px 0', borderBottom: i < documentos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', fontWeight: 500 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${d.ok ? '#0F6E56' : '#BA7517'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {d.ok ? Icons.checkSmall : Icons.xSmall}
                                        </div>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombre}</span>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>{d.req}</div>
                                    <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: d.ok ? '#475569' : '#BA7517' }}>{d.comp}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: '#64748b' }}>Promedio de documentos completos</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>84%</span>
                            </div>
                            <div style={{ height: 6, width: '100%', background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: 6, width: '84%', background: '#0F6E56', borderRadius: 4 }} />
                            </div>
                        </div>
                    </div>

                    {/* Actividad Reciente */}
                    <div style={surface}>
                        <p style={surfaceTitle}>
                            Actividad reciente
                            <Link to="/app/actividad" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todo</Link>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {actividad.map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {a.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.4 }}>
                                            {a.title} <span style={{ fontWeight: 600, color: '#0f172a' }}>{a.bold}</span>
                                        </p>
                                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0 0' }}>{a.time}</p>
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