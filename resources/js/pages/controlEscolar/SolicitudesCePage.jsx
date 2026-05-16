import React from 'react';
import { Link } from 'react-router-dom';
import { CE_DEMO_COMENTARIOS_SOL, CE_DEMO_SOLICITUDES, CE_TIPOS_SOLICITUD } from '../../data/controlEscolarDemoData';

function initials(nombre = '') {
    return nombre
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('');
}

const AVATAR_COLORS = [
    { bg: '#DBEAFE', text: '#185FA5' }, 
    { bg: '#DCFCE7', text: '#0F6E56' }, 
    { bg: '#FEF3C7', text: '#BA7517' }, 
    { bg: '#EEEDFE', text: '#534AB7' }, 
    { bg: '#F1F5F9', text: '#475569' }, 
];

function avatarStyle(i) {
    const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
    return { backgroundColor: c.bg, color: c.text };
}

function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'resuelta': { background: '#EAF3DE', color: '#3B6D11' },     
        'pendiente': { background: '#DBEAFE', color: '#185FA5' },    
        'en revisión': { background: '#FEF3C7', color: '#BA7517' },  
        'rechazada': { background: '#FEE2E2', color: '#991B1B' },    
        'baja': { background: '#EAF3DE', color: '#3B6D11' },         
        'media': { background: '#FEF3C7', color: '#BA7517' },        
        'alta': { background: '#FEE2E2', color: '#991B1B' },         
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
    fileText: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
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
    checkCircle: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    plus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    check: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    xIcon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    user: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    messageSquare: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    filter: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
};

const DEMO_SOLICITUDES = [
    { folio: 'SOL-2025-0058', tipo: 'Constancia de estudios', alumno: 'María Fernanda López Ruiz', id: 'A23010245', prioridad: 'Media', fecha: '20/05/2025', hora: '09:32 a. m.', estatus: 'Pendiente' },
    { folio: 'SOL-2025-0057', tipo: 'Baja temporal', alumno: 'José Andrés Martínez Díaz', id: 'A23009876', prioridad: 'Alta', fecha: '20/05/2025', hora: '09:15 a. m.', estatus: 'En revisión' },
    { folio: 'SOL-2025-0056', tipo: 'Cambio de grupo', alumno: 'Ana Paula García Torres', id: 'A23011488', prioridad: 'Media', fecha: '20/05/2025', hora: '08:47 a. m.', estatus: 'En revisión' },
    { folio: 'SOL-2025-0055', tipo: 'Constancia de estudios', alumno: 'Diego Alejandro Pérez Soto', id: 'A23010567', prioridad: 'Baja', fecha: '20/05/2025', hora: '08:25 a. m.', estatus: 'Pendiente' },
    { folio: 'SOL-2025-0054', tipo: 'Reinscripción extemporánea', alumno: 'Valeria Hernández Cruz', id: 'A23011123', prioridad: 'Alta', fecha: '20/05/2025', hora: '08:03 a. m.', estatus: 'Pendiente' },
    { folio: 'SOL-2025-0053', tipo: 'Cambio de turno', alumno: 'Emiliano Ruiz Salazar', id: 'A23011705', prioridad: 'Media', fecha: '19/05/2025', hora: '04:12 p. m.', estatus: 'En revisión' },
    { folio: 'SOL-2025-0052', tipo: 'Reconocimiento de materias', alumno: 'Sofía Martínez Vega', id: 'A23011209', prioridad: 'Media', fecha: '19/05/2025', hora: '03:45 p. m.', estatus: 'Pendiente' },
    { folio: 'SOL-2025-0051', tipo: 'Baja definitiva', alumno: 'Carlos Iván Ramírez León', id: 'A23010412', prioridad: 'Alta', fecha: '19/05/2025', hora: '02:37 p. m.', estatus: 'Resuelta' },
];

const DEMO_TIPOS = [
    { tipo: 'Constancias', n: '18' },
    { tipo: 'Bajas', n: '10' },
    { tipo: 'Cambios', n: '9' },
    { tipo: 'Reinscripciones', n: '8' },
    { tipo: 'Documentos oficiales', n: '5' },
    { tipo: 'Reconocimientos', n: '4' },
    { tipo: 'Otros trámites', n: '4' },
];

const DEMO_COMENTARIOS = [
    { autor: 'José Luis Martínez', rol: 'Control Escolar', tiempo: 'Hoy, 09:10 a. m.', texto: 'Se requiere el comprobante de pago actualizado.', folio: 'SOL-2025-0058' },
    { autor: 'María Bautista', rol: 'Docente', tiempo: 'Hoy, 08:45 a. m.', texto: 'Recomiendo aprobar el cambio de grupo.', folio: 'SOL-2025-0056' },
    { autor: 'Ana Rodríguez', rol: 'Control Escolar', tiempo: 'Ayer, 04:30 p. m.', texto: 'Documentación completa, listo para aprobar.', folio: 'SOL-2025-0053' },
];

export function SolicitudesCePage() {
    const rows = (typeof CE_DEMO_SOLICITUDES !== 'undefined' && CE_DEMO_SOLICITUDES.length > 0) ? CE_DEMO_SOLICITUDES : DEMO_SOLICITUDES;
    const tipos = (typeof CE_TIPOS_SOLICITUD !== 'undefined' && CE_TIPOS_SOLICITUD.length > 0) ? CE_TIPOS_SOLICITUD : DEMO_TIPOS;
    const comentarios = (typeof CE_DEMO_COMENTARIOS_SOL !== 'undefined' && CE_DEMO_COMENTARIOS_SOL.length > 0) ? CE_DEMO_COMENTARIOS_SOL : DEMO_COMENTARIOS;

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
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Solicitudes y trámites</h1>
                        {Icons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Administra y da seguimiento a las solicitudes y trámites de los alumnos.
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
                        { to: '/app/control-escolar/solicitudes', label: 'Nueva solicitud', icon: Icons.plus, color: '#185FA5' },
                        { to: '/app/control-escolar/solicitudes', label: 'Revisar', icon: Icons.eye, color: '#185FA5' },
                        { to: '/app/control-escolar/solicitudes', label: 'Aprobar', icon: Icons.check, color: '#0F6E56' },
                        { to: '/app/control-escolar/solicitudes', label: 'Rechazar', icon: Icons.xIcon, color: '#991B1B' },
                        { to: '/app/control-escolar/solicitudes', label: 'Asignar', icon: Icons.user, color: '#534AB7' },
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
                    to="/app/control-escolar/solicitudes?filtros=1"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{Icons.filter}</span> Filtros
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard 
                    icon={Icons.fileText} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Pendientes" value="58" 
                    trend="↓ 12% vs. ciclo anterior" trendColor="#0F6E56" 
                />
                <MetricCard 
                    icon={Icons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Urgentes" value="7" 
                    trend="↑ 75% vs. ciclo anterior" trendColor="#991B1B" 
                />
                <MetricCard 
                    icon={Icons.clock} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="En revisión" value="16" 
                    trend="↑ 14% vs. ciclo anterior" trendColor="#BA7517" 
                />
                <MetricCard 
                    icon={Icons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Resueltas" value="124" 
                    trend="↓ 8% vs. ciclo anterior" trendColor="#0F6E56" 
                />
            </div>

            <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', marginBottom: 24 }}>
                Desde aquí se canalizan trámites de constancias, cambios y revisiones. Use la bandeja de <Link to="/app/solicitudes-matricula" style={{ color: '#185FA5', fontWeight: 600, textDecoration: 'none' }}>solicitudes de matrícula</Link> para el flujo específico hacia Educación Superior.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={surface}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                                Todas las solicitudes <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
                            </h2>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Mostrando 1 a 10 de 58 solicitudes</p>
                        </div>
                        
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                {Icons.search}
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar en la tabla..."
                                style={{
                                    height: 36, width: 250,
                                    paddingLeft: 34, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, color: '#0f172a', background: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', width: 40 }}>
                                        <input type="checkbox" style={{ borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                    </th>
                                    {['Folio', 'Tipo', 'Alumno', 'Prioridad', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
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
                                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                            <input type="checkbox" style={{ borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                                            <Link to="#" style={{ color: '#185FA5', textDecoration: 'none' }}>{r.folio}</Link>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.tipo}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.id}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.prioridad}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.hora}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: Icons.user, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: Icons.check, color: '#0F6E56', bg: 'white', border: '#e2e8f0' },
                                                    { icon: Icons.xIcon, color: '#991B1B', bg: '#FEE2E2', border: '#FEE2E2' },
                                                    { icon: Icons.messageSquare, color: '#185FA5', bg: 'white', border: '#e2e8f0' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
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
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['<', '1', '2', '3', '4', '5', '6', '>'].map((p, idx) => (
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
                        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            Filas por página: 
                            <select style={{ height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 8px', background: 'white', outline: 'none', color: '#0f172a' }}>
                                <option>10</option>
                                <option>25</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={surface}>
                        <p style={surfaceTitle}>Tipos de solicitud</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                            {tipos.map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: i < tipos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <span style={{ fontSize: 13, color: '#475569' }}>{t.tipo}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', background: '#DBEAFE', padding: '2px 8px', borderRadius: 6 }}>{t.n}</span>
                                </div>
                            ))}
                        </div>
                        <Link to="#" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                            Ver todos los tipos ›
                        </Link>
                    </div>

                    <div style={surface}>
                        <p style={surfaceTitle}>Comentarios recientes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {comentarios.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: i < comentarios.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div
                                        style={{
                                            ...avatarStyle(i + 3), // offset color
                                            width: 32, height: 32, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                                        }}
                                    >
                                        {initials(c.autor)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                                {c.autor} <span style={{ fontWeight: 400, color: '#64748b' }}>({c.rol})</span>
                                            </p>
                                            <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 8 }}>{c.tiempo}</span>
                                        </div>
                                        <p style={{ fontSize: 12, color: '#475569', margin: '4px 0', lineHeight: 1.4 }}>
                                            {c.texto}
                                        </p>
                                        <Link to="#" style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                            Ver solicitud {c.folio}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="#" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                            Ver todos los comentarios ›
                        </Link>
                    </div>

                </div>
            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}