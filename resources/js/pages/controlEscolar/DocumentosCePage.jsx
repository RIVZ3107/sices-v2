import React from 'react';
import { Link } from 'react-router-dom';
import { CE_DEMO_DOCUMENTOS_EMITIDOS, CE_PLANTILLAS_RAPIDAS } from '../../data/controlEscolarDemoData';

function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'concluido': { background: '#EAF3DE', color: '#3B6D11' },     
        'en proceso': { background: '#DBEAFE', color: '#185FA5' },    
        'en revisión': { background: '#FEF3C7', color: '#BA7517' },   
        'rechazado': { background: '#FEE2E2', color: '#991B1B' },     
        'cancelado': { background: '#F1EFE8', color: '#5F5E5A' },     
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

function MetricCard({ icon, iconBg, iconColor, title, value, trend, trendColor, topLinkText, topLinkUrl }) {
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
                position: 'relative'
            }}
        >
            {topLinkText && (
                <Link to={topLinkUrl || '#'} style={{ position: 'absolute', top: 16, right: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                    {topLinkText}
                </Link>
            )}
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
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500, paddingRight: topLinkText ? 50 : 0 }}>{title}</p>
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
    folder: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    file: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    checkDoc: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <polyline points="9 15 11 17 15 12" />
        </svg>
    ),
    cloudUpload: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    ),
    moreHorizontal: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
        </svg>
    ),
    download: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    ),
    refreshCw: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    list: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    send: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    xIcon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    gear: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    penTool: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
        </svg>
    ),
    lock: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    helpCircle: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    bookOpen: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
};

const DEMO_DOCS_EMITIDOS = [
    { tipo: 'Constancia de estudios', subTipo: 'Constancia', alumno: 'María Fernanda López Ruiz', matricula: 'A23010245', fecha: '20/05/2025', hora: '09:32 a. m.', estatus: 'Concluido', colorTipo: '#534AB7' },
    { tipo: 'Historial académico', subTipo: 'Historial', alumno: 'José Andrés Martínez Díaz', matricula: 'A23009876', fecha: '20/05/2025', hora: '09:15 a. m.', estatus: 'En proceso', colorTipo: '#185FA5' },
    { tipo: 'Boleta de calificaciones', subTipo: 'Boleta', alumno: 'Ana Paula García Torres', matricula: 'A23011488', fecha: '20/05/2025', hora: '08:47 a. m.', estatus: 'En revisión', colorTipo: '#0F6E56' },
    { tipo: 'Kardex', subTipo: 'Kardex', alumno: 'Diego Alejandro Pérez Soto', matricula: 'A23010567', fecha: '20/05/2025', hora: '08:25 a. m.', estatus: 'Concluido', colorTipo: '#BA7517' },
    { tipo: 'Constancia de baja temporal', subTipo: 'Constancia', alumno: 'Valeria Hernández Cruz', matricula: 'A23011123', fecha: '20/05/2025', hora: '06:03 a. m.', estatus: 'Rechazado', colorTipo: '#534AB7' },
    { tipo: 'Constancia de inscripción', subTipo: 'Constancia', alumno: 'Carlos Eduardo Ruiz Vega', matricula: 'A23011705', fecha: '19/05/2025', hora: '04:12 p. m.', estatus: 'Concluido', colorTipo: '#185FA5' },
    { tipo: 'Duplicado de boleta', subTipo: 'Boleta', alumno: 'Sofía Martínez Delgado', matricula: 'A23012033', fecha: '19/05/2025', hora: '02:30 p. m.', estatus: 'Cancelado', colorTipo: '#0F6E56' },
];

const DEMO_PLANTILLAS = [
    { nombre: 'Constancia de estudios', versiones: '4 versiones' },
    { nombre: 'Historial académico', versiones: '3 versiones' },
    { nombre: 'Boleta de calificaciones', versiones: '2 versiones' },
    { nombre: 'Kardex', versiones: '2 versiones' },
    { nombre: 'Constancia de inscripción', versiones: '2 versiones' },
];

const DEMO_ACCESOS = [
    { nombre: 'Configuración de plantillas', icon: Icons.gear },
    { nombre: 'Firmas y sellos digitales', icon: Icons.penTool },
    { nombre: 'Catálogo de documentos', icon: Icons.list },
    { nombre: 'Permisos y visibilidad', icon: Icons.lock },
];

export function DocumentosCePage() {
    const rows = (typeof CE_DEMO_DOCUMENTOS_EMITIDOS !== 'undefined' && CE_DEMO_DOCUMENTOS_EMITIDOS.length > 0) ? CE_DEMO_DOCUMENTOS_EMITIDOS : DEMO_DOCS_EMITIDOS;
    const plantillas = DEMO_PLANTILLAS;
    const accesos = DEMO_ACCESOS;

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

    const getTipoIcon = (color) => {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        );
    };

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            <div
                style={{
                    marginBottom: 20,
                    padding: '14px 18px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e3a5f' }}>Certificación electrónica (SEP)</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
                        Borradores, envío a revisión y seguimiento institucional en el módulo operativo.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link to="/app/documentos/bandejas/borradores" style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}>
                        Bandeja certificados
                    </Link>
                    <Link to="/app/expedientes" style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}>
                        Expediente alumno
                    </Link>
                    <Link to="/app/materias-cursadas" style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}>
                        Calificaciones
                    </Link>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Documentos y constancias</h1>
                    {Icons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{Icons.refreshCw}</span> Actualizado: 20/05/2025 09:45 a. m.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '#', label: 'Generar constancia', icon: Icons.fileText, color: '#534AB7' },
                        { to: '#', label: 'Historial académico', icon: Icons.folder, color: '#185FA5' },
                        { to: '#', label: 'Boleta', icon: Icons.file, color: '#0F6E56' },
                        { to: '#', label: 'Kardex PDF', icon: Icons.checkDoc, color: '#BA7517' },
                        { to: '#', label: 'Subir documento', icon: Icons.cloudUpload, color: '#185FA5' },
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
                <Link
                    to="#"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#0f172a', display: 'flex' }}>{Icons.moreHorizontal}</span> Más opciones
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard 
                    icon={Icons.fileText} iconBg="#EEEDFE" iconColor="#534AB7" 
                    title="Documentos generados hoy" value="48" 
                    trend="↑ 25% vs. día anterior" trendColor="#0F6E56" 
                />
                <MetricCard 
                    icon={Icons.checkDoc} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Pendientes de firma interna" value="16" 
                    trend="↓ 11% vs. día anterior" trendColor="#0F6E56" 
                />
                <MetricCard 
                    icon={Icons.cloudUpload} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Solicitudes de descarga" value="34" 
                    trend="↑ 18% vs. día anterior" trendColor="#991B1B" 
                />
                <MetricCard 
                    icon={Icons.file} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Plantillas disponibles" value="22" 
                    trend="— Sin cambios" trendColor="#94a3b8" 
                    topLinkText="Ver todas" topLinkUrl="/app/plantillas"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            <span style={{ color: '#64748b' }}>{Icons.list}</span> Documentos emitidos
                        </h2>
                        
                        <Link to="#" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                            Ver todos
                        </Link>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Tipo', 'Alumno', 'Fecha', 'Estatus', 'Descarga', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 10px',
                                                textAlign: (h === 'Descarga' || h === 'Acciones') ? 'center' : 'left',
                                                fontSize: 11,
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
                                {rows.map((r, i) => (
                                    <tr
                                        key={i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                <div style={{ marginTop: 2 }}>{getTipoIcon(r.colorTipo)}</div>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.tipo || r.nombre}</p>
                                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.subTipo || 'Documento'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula || r.id}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.hora || '00:00 a. m.'}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                            <Link to="#" style={{ display: 'inline-flex', color: '#185FA5', textDecoration: 'none' }}>
                                                {Icons.download}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: Icons.download, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: Icons.send, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: Icons.xIcon, color: '#991B1B', bg: '#FEE2E2', border: '#FEE2E2' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{ 
                                                            width: 28, height: 28, borderRadius: 6, 
                                                            background: btn.bg, border: `1px solid ${btn.border}`, 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            color: btn.color, cursor: 'pointer'
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

                    {/* Pagination */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 7 de 48 resultados</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['<', '1', '2', '3', '...', '7', '>'].map((p, idx) => (
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
                            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                10 por página <span>v</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Paneles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Plantillas y accesos rápidos */}
                    <div style={surface}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Plantillas y accesos rápidos</p>
                            <Link to="#" style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todas</Link>
                        </div>
                        
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, margin: 0 }}>Plantillas frecuentes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, marginBottom: 20 }}>
                            {plantillas.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ color: '#534AB7', display: 'flex' }}>
                                            {Icons.fileText}
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{p.nombre}</p>
                                    </div>
                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{p.versiones}</span>
                                </div>
                            ))}
                        </div>

                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, margin: 0 }}>Accesos rápidos</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                            {accesos.map((a, i) => (
                                <Link key={i} to="#" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', paddingBottom: 10, borderBottom: i < accesos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ display: 'flex', color: '#185FA5' }}>{a.icon}</span>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: '#185FA5' }}>{a.nombre}</span>
                                    </div>
                                    <span style={{ color: '#94a3b8', fontSize: 14 }}>›</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ¿Necesitas ayuda? */}
                    <div style={surface}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
                            <span style={{ color: '#185FA5' }}>{Icons.helpCircle}</span> ¿Necesitas ayuda?
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                            Consulta la guía de documentos o contacta al soporte.
                        </p>
                        <Link
                            to="#"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 36, padding: '0 16px', borderRadius: 8,
                                background: 'white', border: '1px solid #185FA5',
                                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#185FA5'
                            }}
                        >
                            <span style={{ display: 'flex' }}>{Icons.bookOpen}</span> Ir a la guía
                        </Link>
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