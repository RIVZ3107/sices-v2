import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../../authStore';
import { DireccionNotificacionesPage } from '../direccion/DireccionNotificacionesPage';
import { CE_DEMO_NOTIFICACIONES } from '../../data/controlEscolarDemoData';

// --- UTILIDADES DE ESTILO (PALETA UNIFICADA BASE) ---
function PriorityBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'baja': { background: '#EAF3DE', color: '#3B6D11' },     // Verde
        'media': { background: '#FEF3C7', color: '#BA7517' },    // Naranja
        'alta': { background: '#FEE2E2', color: '#991B1B' },     // Rojo
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

function MetricCard({ icon, iconBg, iconColor, title, value, trend }) {
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
                <p style={{ fontSize: 11, marginTop: 6, color: '#64748b', fontWeight: 500 }}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

// --- ICONOS UNIFICADOS ---
const Icons = {
    bell: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    alertTriangle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    clock: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    zap: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    check: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    checkCircle: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    filter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    settings: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
    moreVertical: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
    xIcon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    user: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
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
    info: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    cornerUpLeft: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
    ),
    archive: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    ),
    fileCheck: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <polyline points="9 15 11 17 15 12" />
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
    refreshCwSmall: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    )
};

// --- DATOS DEMO FALLBACKS ---
const CATEGORIAS = [
    { label: 'Todas las notificaciones', n: 56, icon: Icons.fileText, active: true },
    { label: 'Académicas', n: 15, icon: Icons.fileText, active: false },
    { label: 'Administrativas', n: 12, icon: Icons.calendar, active: false },
    { label: 'Documentos', n: 9, icon: Icons.folder, active: false },
    { label: 'Sistema', n: 16, icon: Icons.zap, active: false },
    { label: 'Inscripciones', n: 4, icon: Icons.checkCircle, active: false },
    { label: 'Reinscripciones', n: 4, icon: Icons.refreshCwSmall, active: false },
    { label: 'Solicitudes', n: 7, icon: Icons.alertTriangle, active: false },
];

const DEMO_NOTIFICACIONES = [
    { tipoIcon: Icons.alertTriangle, color: '#991B1B', msgTitle: 'Documento rechazado', msgSub: 'El comprobante de domicilio fue rechazado.', usrName: 'María Fernanda López Ruiz', usrId: 'A23010245', fecha: '20/05/2025', hora: '09:32 a. m.', prioridad: 'Alta', leida: false },
    { tipoIcon: Icons.fileText, color: '#534AB7', msgTitle: 'Nueva inscripción registrada', msgSub: 'Se completó la inscripción correctamente.', usrName: 'José Andrés Martínez Díaz', usrId: 'A23009876', fecha: '20/05/2025', hora: '09:15 a. m.', prioridad: 'Media', leida: false },
    { tipoIcon: Icons.clock, color: '#BA7517', msgTitle: 'Recordatorio: reinscripción pendiente', msgSub: 'El alumno aún no ha completado su reinscripción.', usrName: 'Ana Paula García Torres', usrId: 'A23011488', fecha: '20/05/2025', hora: '08:47 a. m.', prioridad: 'Media', leida: false },
    { tipoIcon: Icons.info, color: '#185FA5', msgTitle: 'Constancia generada', msgSub: 'La constancia de estudios fue generada.', usrName: 'Diego Alejandro Pérez Soto', usrId: 'A23010567', fecha: '20/05/2025', hora: '08:25 a. m.', prioridad: 'Baja', leida: true },
    { tipoIcon: Icons.fileText, color: '#534AB7', msgTitle: 'Documento cargado', msgSub: 'Se ha cargado un nuevo documento al expediente.', usrName: 'Valeria Hernández Cruz', usrId: 'A23011123', fecha: '20/05/2025', hora: '08:03 a. m.', prioridad: 'Baja', leida: true },
    { tipoIcon: Icons.settings, color: '#64748b', msgTitle: 'Actualización del sistema', msgSub: 'Nueva versión del sistema disponible.', usrName: 'Sistema', usrId: '', fecha: '19/05/2025', hora: '07:45 p. m.', prioridad: 'Baja', leida: true },
    { tipoIcon: Icons.checkCircle, color: '#0F6E56', msgTitle: 'Solicitud concluida', msgSub: 'Tu solicitud ha sido concluida exitosamente.', usrName: 'Carlos Alberto Mejía Ruiz', usrId: 'A23010789', fecha: '19/05/2025', hora: '04:30 p. m.', prioridad: 'Baja', leida: true },
    { tipoIcon: Icons.clock, color: '#BA7517', msgTitle: 'Recordatorio: documentos pendientes', msgSub: 'Tienes documentos pendientes por cargar.', usrName: 'Sofía Daniela Rojas Vega', usrId: 'A23011234', fecha: '19/05/2025', hora: '11:20 a. m.', prioridad: 'Media', leida: true },
];

export function NotificacionesCePage() {
    const roles = getUser()?.roles ?? [];
    
    // Check if the user is a director, redirect or render specific view
    if (!roles.includes('control_escolar_escuela') && roles.includes('director_escuela')) {
        return <DireccionNotificacionesPage />;
    }

    // Determine specific subtitle based on role
    const esEducacionSuperior = roles.includes('educacion_superior');
    const headerSubtitle = esEducacionSuperior
        ? 'Centro de avisos para Educación Superior: lectura, archivo, respuesta y apertura del trámite relacionado. Preferencias personales únicamente; sin reglas globales del sistema.'
        : 'Centro de avisos operativos. No incluye administración de categorías globales ni alertas técnicas del sistema.';

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

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* ── Header Layout ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Centro de notificaciones</h1>
                        <span style={{ color: '#185FA5' }}>{Icons.bell}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{Icons.clock}</span> Actualizado: 20/05/2025 09:45 a. m.
                        <span style={{ marginLeft: 8, cursor: 'pointer' }}>{Icons.refreshCwSmall}</span>
                    </p>
                </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '#', label: 'Marcar todas leídas', icon: Icons.check, color: '#0f172a' },
                        { to: '#', label: 'Filtrar', icon: Icons.filter, color: '#0f172a' },
                        { to: '#', label: 'Configurar alertas', icon: Icons.settings, color: '#0f172a' },
                    ].map(({ to, label, icon, color }) => (
                        <Link
                            key={label}
                            to={to}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: color
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                    <Link
                        to="#"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            height: 38, padding: '0 16px', borderRadius: 8,
                            background: 'white', border: '1px solid #e2e8f0',
                            fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#0f172a'
                        }}
                    >
                        <span style={{ color: '#185FA5', display: 'flex' }}>{Icons.download}</span> Exportar
                    </Link>
                </div>
            </div>

            {/* ── Metrics Grid (Tonos Pastel Unificados) ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard 
                    icon={Icons.bell} iconBg="#185FA5" iconColor="white" 
                    title="No leídas" value="18" 
                    trend="de 56 notificaciones" 
                />
                <MetricCard 
                    icon={Icons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Críticas" value="4" 
                    trend="requieren atención" 
                />
                <MetricCard 
                    icon={Icons.clock} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Recordatorios" value="12" 
                    trend="próximos 7 días" 
                />
                <MetricCard 
                    icon={Icons.zap} iconBg="#534AB7" iconColor="white" 
                    title="Automáticas" value="22" 
                    trend="generadas por el sistema" 
                />
            </div>

            {/* ── Main grid (Izquierda Categorías, Centro Tabla, Derecha Detalle) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: 16, alignItems: 'start' }}>

                {/* Left Sidebar: Categorías */}
                <div style={{ ...surface, padding: '16px 0' }}>
                    <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ color: '#64748b' }}>{Icons.filter}</span>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Categorías</h2>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {CATEGORIAS.map((cat, idx) => (
                            <li key={idx} style={{ padding: '4px 12px' }}>
                                <Link to="#" style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                                    background: cat.active ? '#EFF6FF' : 'transparent',
                                    color: cat.active ? '#185FA5' : '#475569',
                                    fontWeight: cat.active ? 600 : 500,
                                    transition: 'background 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: cat.active ? '#185FA5' : '#94a3b8' }}>{cat.icon}</span>
                                        <span style={{ fontSize: 13 }}>{cat.label}</span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.active ? '#185FA5' : '#64748b' }}>{cat.n}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div style={{ padding: '16px 24px 0 24px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
                        <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}>
                            {Icons.settings} Administrar categorías
                        </Link>
                    </div>
                </div>

                {/* Center Area: Tabla de Notificaciones */}
                <div style={{ ...surface, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 20px 12px 20px' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Notificaciones (56)
                        </h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Tipo', 'Mensaje', 'Usuario/Alumno relacionado', 'Fecha ⇅', 'Prioridad', 'Estatus', ''].map((h, i) => (
                                        <th
                                            key={i}
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: h === '' ? 'center' : 'left',
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
                                {DEMO_NOTIFICACIONES.map((n, i) => (
                                    <tr
                                        key={i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer', background: i === 0 ? '#f8fafc' : 'white' }}
                                        onMouseEnter={(e) => { if(i !== 0) e.currentTarget.style.background = '#f8fafc' }}
                                        onMouseLeave={(e) => { if(i !== 0) e.currentTarget.style.background = 'transparent' }}
                                    >
                                        <td style={{ padding: '16px', width: 40, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {!n.leida ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#185FA5', flexShrink: 0 }} /> : <div style={{ width: 8, height: 8, flexShrink: 0 }} />}
                                                <span style={{ color: n.color }}>{n.tipoIcon}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{n.msgTitle}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.msgSub}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>{n.usrName}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{n.usrId}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{n.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{n.hora}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <PriorityBadge>{n.prioridad}</PriorityBadge>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: !n.leida ? '#185FA5' : '#94a3b8' }}>
                                                {!n.leida ? 'No leída' : 'Leída'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{ color: '#94a3b8' }}>{Icons.moreVertical}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 8 de 56 notificaciones</span>
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
                                8 por página <span>v</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Detalle Fijo */}
                <div style={{ ...surface, position: 'sticky', top: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Detalle de la notificación</h2>
                        <span style={{ color: '#64748b', cursor: 'pointer' }}>{Icons.xIcon}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, color: '#991B1B', marginBottom: 16 }}>
                        <span>{Icons.alertTriangle}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Alta prioridad</span>
                    </div>

                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Documento rechazado</h3>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 12px 0' }}>Comprobante de domicilio</p>
                        
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
                            El documento cargado para el alumno <strong>María Fernanda López Ruiz</strong> ha sido rechazado por no cumplir con los lineamientos establecidos.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.user}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Alumno relacionado</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>María Fernanda López Ruiz (A23010245)</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.folder}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Categoría</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>Documentos</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.calendar}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Fecha y hora</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>20/05/2025 09:32 a. m.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{Icons.info}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Fuente</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>Usuario: Ana Torres (Control Escolar)</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>Motivo del rechazo</p>
                            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: 0, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                El comprobante de domicilio es ilegible. Por favor, carga un documento legible y vigente (máximo 3 meses de antigüedad).
                            </p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>Acciones recomendadas</p>
                            <ul style={{ fontSize: 12, color: '#475569', margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
                                <li>Carga un nuevo documento desde el expediente del alumno.</li>
                            </ul>
                        </div>

                        <button 
                            style={{ 
                                width: '100%', height: 40, borderRadius: 8, background: '#185FA5', 
                                color: 'white', fontSize: 13, fontWeight: 600, border: 'none', 
                                cursor: 'pointer', marginBottom: 24 
                            }}
                        >
                            Ir al expediente del alumno
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>
                                {Icons.eye} Ver detalle
                            </Link>
                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>
                                {Icons.check} Marcar leída
                            </Link>
                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>
                                {Icons.archive} Archivar
                            </Link>
                            <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#185FA5', textDecoration: 'none' }}>
                                {Icons.cornerUpLeft} Responder
                            </Link>
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