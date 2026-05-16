import React from 'react';
import { Link } from 'react-router-dom';

// --- UTILIDADES DE ESTILO (PALETA UNIFICADA) ---
function StatusBadge({ children, tone }) {
    const v = String(children).toLowerCase();
    
    // Mapeo por defecto si no se pasa un 'tone' específico
    const defaultStyles = {
        'aprobada': { background: '#DCFCE7', color: '#0F6E56' },
        'pendiente': { background: '#DCFCE7', color: '#0F6E56' },
        'en revisión': { background: '#DBEAFE', color: '#185FA5' },
        'observada': { background: '#FEE2E2', color: '#991B1B' },
        'rechazada': { background: '#FEE2E2', color: '#991B1B' },
    };

    // Mapeo de tonos forzados (para cuando "En revisión" pueda ser naranja o azul)
    const toneStyles = {
        'green': { background: '#DCFCE7', color: '#0F6E56' },
        'blue': { background: '#DBEAFE', color: '#185FA5' },
        'orange': { background: '#FFEDD5', color: '#C2410C' },
        'red': { background: '#FEE2E2', color: '#991B1B' },
    };

    const s = tone ? toneStyles[tone] : (defaultStyles[v] ?? { background: '#F1EFE8', color: '#5F5E5A' });
    
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
    plus: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    clock: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    graduationCap: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    check: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    xIcon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    lock: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    boxX: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
    ),
    alertTriangle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    download: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    pencil: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    history: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <polyline points="12 7 12 12 15 15" />
        </svg>
    ),
    infoCircle: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    ),
};

const DEMO_BAJAS = [
    { alumno: 'María Fernanda López Ruiz', matricula: 'A23010245', tipo: 'Baja temporal', motivo: 'Problemas de salud', fecha: '20/05/2025', hora: '09:32 a. m.', estatus: 'Pendiente', tone: 'green', typeColor: '#DC2626', icon: Icons.lock },
    { alumno: 'José Andrés Martínez Díaz', matricula: 'A23009876', tipo: 'Baja definitiva', motivo: 'Cambio de residencia', fecha: '20/05/2025', hora: '09:15 a. m.', estatus: 'En revisión', tone: 'blue', typeColor: '#6B21A8', icon: Icons.boxX },
    { alumno: 'Ana Paula García Torres', matricula: 'A23011488', tipo: 'Cambio de grupo', motivo: 'Reorganización académica', fecha: '20/05/2025', hora: '08:47 a. m.', estatus: 'En revisión', tone: 'orange', typeColor: '#185FA5', icon: Icons.users },
    { alumno: 'Diego Alejandro Pérez Soto', matricula: 'A23010567', tipo: 'Cambio de turno', motivo: 'Compatibilidad de horarios', fecha: '20/05/2025', hora: '08:25 a. m.', estatus: 'Pendiente', tone: 'green', typeColor: '#0F6E56', icon: Icons.clock },
    { alumno: 'Valeria Hernández Cruz', matricula: 'A23011123', tipo: 'Cambio de programa', motivo: 'Cambio de área de estudio', fecha: '20/05/2025', hora: '08:03 a. m.', estatus: 'Observada', tone: 'red', typeColor: '#534AB7', icon: Icons.graduationCap },
    { alumno: 'Luis Fernando Aguilar León', matricula: 'A23010398', tipo: 'Baja definitiva', motivo: 'Abandono de estudios', fecha: '19/05/2025', hora: '04:12 p. m.', estatus: 'Aprobada', tone: 'green', typeColor: '#DC2626', icon: Icons.lock },
    { alumno: 'Sofía Valentina Morales Peña', matricula: 'A23011620', tipo: 'Cambio de grupo', motivo: 'Nivelación de grupos', fecha: '19/05/2025', hora: '03:41 p. m.', estatus: 'Rechazada', tone: 'red', typeColor: '#185FA5', icon: Icons.users },
];

const MOTIVOS_DONUT = [
    { label: 'Cambio de residencia', pct: 37, count: 21, color: '#185FA5' }, // Azul
    { label: 'Problemas de salud', pct: 21, count: 12, color: '#0F6E56' },   // Verde
    { label: 'Incompatibilidad de horarios', pct: 16, count: 9, color: '#EA580C' }, // Naranja
    { label: 'Reorganización académica', pct: 11, count: 6, color: '#6B21A8' }, // Morado
    { label: 'Abandono de estudios', pct: 8, count: 4, color: '#EAB308' },    // Amarillo
    { label: 'Otros', pct: 7, count: 4, color: '#64748b' },                   // Gris
];

const CAMBIOS_RECIENTES = [
    { text: 'Baja temporal aprobada', subtext: 'María José Ramírez López (A23010765)', date: '20/05/2025 09:10 a. m.', color: '#0F6E56' },
    { text: 'Cambio de grupo en revisión', subtext: 'Carlos Eduardo Flores (A23010987)', date: '20/05/2025 08:55 a. m.', color: '#EA580C' },
    { text: 'Baja definitiva rechazada', subtext: 'Diana Sofía Méndez (A23011234)', date: '20/05/2025 08:30 a. m.', color: '#DC2626' },
    { text: 'Cambio de turno aprobado', subtext: 'Jorge Luis Hernández (A23010102)', date: '20/05/2025 07:45 a. m.', color: '#0F6E56' },
    { text: 'Cambio de programa en revisión', subtext: 'Camila Andrea Torres (A23011510)', date: '20/05/2025 07:15 a. m.', color: '#6B21A8' },
];

export function BajasCambiosPage() {
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

    const grad = `conic-gradient(${MOTIVOS_DONUT.map((m, i, arr) => {
        const start = (arr.slice(0, i).reduce((s, x) => s + x.pct, 0) / 100) * 360;
        const end = (arr.slice(0, i + 1).reduce((s, x) => s + x.pct, 0) / 100) * 360;
        return `${m.color} ${start}deg ${end}deg`;
    }).join(', ')})`;

    return (
        <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

                
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Bajas y cambios de estatus</h1>
                    {Icons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        🕐 Actualizado: 20/05/2025 09:45 a. m.
                    </p>
                </div>
            </div>

            
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { label: 'Nueva baja', icon: Icons.plus, color: '#185FA5' },
                        { label: 'Cambio de grupo', icon: Icons.users, color: '#185FA5' },
                        { label: 'Cambio de turno', icon: Icons.clock, color: '#0F6E56' },
                        { label: 'Cambio de programa', icon: Icons.graduationCap, color: '#534AB7' },
                        { label: 'Aprobar', icon: Icons.check, color: '#0F6E56' },
                        { label: 'Rechazar', icon: Icons.xIcon, color: '#DC2626' },
                    ].map(({ label, icon, color }) => (
                        <Link
                            key={label}
                            to="#"
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
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{Icons.download}</span> Exportar v
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard 
                    icon={Icons.lock} iconBg="#FEE2E2" iconColor="#DC2626" 
                    title="Bajas temporales" value="19" 
                    trend="↓ 11% vs. ciclo anterior" trendColor="#0F6E56" 
                />
                <MetricCard 
                    icon={Icons.boxX} iconBg="#F3E8FF" iconColor="#6B21A8" 
                    title="Bajas definitivas" value="27" 
                    trend="↑ 20% vs. ciclo anterior" trendColor="#DC2626" 
                />
                <MetricCard 
                    icon={Icons.users} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Cambios pendientes" value="45" 
                    trend="↓ 6% vs. ciclo anterior" trendColor="#0F6E56" 
                />
                <MetricCard 
                    icon={Icons.alertTriangle} iconBg="#FFEDD5" iconColor="#EA580C" 
                    title="Solicitudes observadas" value="12" 
                    trend="↑ 12% vs. ciclo anterior" trendColor="#DC2626" 
                />
            </div>

            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                
                <div style={surface}>   
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Solicitudes de bajas y cambios {Icons.infoCircle}
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <select style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}>
                                <option>Todos los estatus</option>
                                <option>Pendiente</option>
                                <option>En revisión</option>
                            </select>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    {Icons.search}
                                </span>
                                <input
                                    type="search"
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
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Alumno', 'Tipo de cambio', 'Motivo', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
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
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DEMO_BAJAS.map((r, i) => (
                                    <tr
                                        key={i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#475569' }}>
                                                <span style={{ color: r.typeColor }}>{r.icon}</span> {r.tipo}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 12, color: '#475569' }}>{r.motivo}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.hora}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <StatusBadge tone={r.tone}>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: Icons.eye, color: '#185FA5' },
                                                    { icon: Icons.check, color: '#0F6E56' },
                                                    { icon: Icons.xIcon, color: '#DC2626' },
                                                    { icon: Icons.pencil, color: '#185FA5' },
                                                    { icon: Icons.history, color: '#185FA5' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{ 
                                                            width: 26, height: 26, borderRadius: 6, 
                                                            border: '1px solid #e2e8f0', background: 'white',
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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 7 de 57 resultados</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['<', '1', '2', '3', '4', '5', '...', '8', '>'].map((p, idx) => (
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
                        <p style={surfaceTitle}>Motivos frecuentes</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                            <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white' }} />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                {MOTIVOS_DONUT.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                                            <span style={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{m.label}</span>
                                        </div>
                                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{m.pct}% <span style={{ color: '#94a3b8', fontWeight: 400 }}>({m.count})</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={surface}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Cambios recientes</p>
                            <Link to="#" style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todos</Link>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: 10 }}>
                            <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {CAMBIOS_RECIENTES.map((c, i) => (
                                    <div key={i} style={{ position: 'relative', paddingLeft: 24 }}>
                                        <div style={{ position: 'absolute', left: 1, top: 4, width: 8, height: 8, borderRadius: '50%', background: c.color, border: '2px solid white' }} />
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>{c.text}</p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>{c.subtext}</p>
                                        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{c.date}</p>
                                    </div>
                       
                       ))}
                            </div>
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