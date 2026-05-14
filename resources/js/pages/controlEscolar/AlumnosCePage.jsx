import React from 'react';
import { Link } from 'react-router-dom';
import { CE_DEMO_ALUMNOS, CE_DEMO_ALUMNOS_RECENTES } from '../../data/controlEscolarDemoData';

// --- UTILIDADES DE ESTILO ---
function initials(nombre = '') {
    return nombre
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('');
}

const AVATAR_COLORS = [
    { bg: '#B5D4F4', text: '#0C447C' },
    { bg: '#C0DD97', text: '#27500A' },
    { bg: '#FAC775', text: '#633806' },
    { bg: '#CECBF6', text: '#3C3489' },
    { bg: '#9FE1CB', text: '#085041' },
];

function avatarStyle(i) {
    const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
    return { backgroundColor: c.bg, color: c.text };
}

function StatusBadge({ children }) {
    const v = String(children).toLowerCase();
    const styles = {
        'activo': { background: '#EAF3DE', color: '#3B6D11' },
        'baja temporal': { background: '#FAEEDA', color: '#854F0B' },
        'egresado': { background: '#EEEDFE', color: '#534AB7' },
        'en revisión': { background: '#FAEEDA', color: '#854F0B' },
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

function QuickAction({ to, iconBg, iconColor, icon, label, sub }) {
    return (
        <Link
            to={to}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid #f1f5f9',
                textDecoration: 'none',
                color: 'inherit',
            }}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
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
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{sub}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </Link>
    );
}

// --- ICONOS ---
const Icons = {
    users: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    clock: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    school: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    warn: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    userPlus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    upload: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    ),
    download: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    ),
    filter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    more: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    eye: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    pencil: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    tray: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2">
            <polyline points="21 15 21 19 3 19 3 15" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    refresh: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
    doc: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    qaUserPlus: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    qaUpload: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    ),
    qaFile: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    qaBook: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    qaRefresh: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
    shieldCheck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#185FA5" stroke="white" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2" />
        </svg>
    )
};


// --- DATOS DEMO ---
const DEMO_ALUMNOS = [
    { matricula: 'A23010245', nombre: 'María Fernanda López Ruiz', programa: 'Ingeniería en Sistemas', periodo: '6°', estatus: 'Activo' },
    { matricula: 'A23009876', nombre: 'José Andrés Martínez Díaz', programa: 'Ingeniería Industrial', periodo: '4°', estatus: 'Activo' },
    { matricula: 'A23011488', nombre: 'Ana Paula García Torres', programa: 'Contaduría Pública', periodo: '6°', estatus: 'En revisión' },
    { matricula: 'A23010567', nombre: 'Diego Alejandro Pérez Soto', programa: 'Ingeniería en Sistemas', periodo: '8°', estatus: 'Activo' },
    { matricula: 'A23011123', nombre: 'Valeria Hernández Cruz', programa: 'Administración', periodo: '2°', estatus: 'Activo' },
    { matricula: 'A23010789', nombre: 'Carlos Alberto Ramírez Vega', programa: 'Ingeniería Industrial', periodo: '6°', estatus: 'Baja temporal' },
    { matricula: 'A23009901', nombre: 'Sofía Laura Méndez Rojas', programa: 'Contaduría Pública', periodo: '4°', estatus: 'Activo' },
    { matricula: 'A23010356', nombre: 'Jorge Emilio Salazar León', programa: 'Ingeniería en Sistemas', periodo: '10°', estatus: 'Egresado' },
    { matricula: 'A23011567', nombre: 'Diana Patricia Jiménez Solís', programa: 'Administración', periodo: '6°', estatus: 'Activo' },
    { matricula: 'A23010112', nombre: 'Luis Fernando Ortega Nava', programa: 'Ingeniería Industrial', periodo: '2°', estatus: 'Activo' },
];

const DEMO_RECIENTES = [
    { matricula: 'A23010245', nombre: 'María Fernanda López Ruiz', programa: 'Ingeniería en Sistemas', estatus: 'Activo' },
    { matricula: 'A23009876', nombre: 'José Andrés Martínez Díaz', programa: 'Ingeniería Industrial', estatus: 'Activo' },
    { matricula: 'A23011488', nombre: 'Ana Paula García Torres', programa: 'Contaduría Pública', estatus: 'Activo' },
];


export function AlumnosCePage() {
    const rows = (typeof CE_DEMO_ALUMNOS !== 'undefined' ? CE_DEMO_ALUMNOS : DEMO_ALUMNOS);
    const recientes = (typeof CE_DEMO_ALUMNOS_RECENTES !== 'undefined' ? CE_DEMO_ALUMNOS_RECENTES : DEMO_RECIENTES);

    /* Estilos compartidos de tarjeta (surface) */
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

            {/* ── Header Layout (Título y Acciones) ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                
                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestión de alumnos</h1>
                    {Icons.shieldCheck}
                </div>

                {/* Right Area: Last updated & Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        🕐 Actualizado: 20/05/2025 09:45 a. m.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { to: '/app/alumnos/crear', label: 'Nuevo alumno', icon: Icons.userPlus, color: '#185FA5' },
                            { to: '/app/control-escolar/importaciones', label: 'Importar', icon: Icons.upload, color: '#0F6E56' },
                            { to: '/app/control-escolar/reportes', label: 'Exportar', icon: Icons.download, color: '#534AB7' },
                            { to: '/app/control-escolar/alumnos?filtros=1', label: 'Filtros', icon: Icons.filter, color: '#185FA5' },
                            { to: '/app/control-escolar/solicitudes', label: 'Más opciones', icon: Icons.more, color: '#64748b' },
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
                </div>
            </div>

            {/* ── Metrics ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <MetricCard icon={Icons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Alumnos activos" value="2,124" trend="↓ 3% vs. ciclo anterior" trendColor="#0F6E56" />
                <MetricCard icon={Icons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Baja temporal" value="196" trend="↓ 5% vs. ciclo anterior" trendColor="#0F6E56" />
                <MetricCard icon={Icons.school} iconBg="#F3E8FF" iconColor="#6B21A8" title="Egresados" value="312" trend="↑ 8% vs. ciclo anterior" trendColor="#B45309" />
                <MetricCard icon={Icons.warn} iconBg="#FFEDD5" iconColor="#C2410C" title="Expedientes incompletos" value="32" trend="↓ 11% vs. ciclo anterior" trendColor="#0F6E56" />
            </div>

            {/* ── Main grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

                {/* Left sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Acciones rápidas */}
                    <div style={surface}>
                        <p style={surfaceTitle}>Acciones rápidas</p>
                        <div style={{ marginTop: 8 }}>
                            <QuickAction to="/app/alumnos/crear" iconBg="#DBEAFE" iconColor="#185FA5" icon={Icons.qaUserPlus} label="Nuevo alumno" sub="Registrar un nuevo alumno" />
                            <QuickAction to="/app/control-escolar/importaciones" iconBg="#DCFCE7" iconColor="#0F6E56" icon={Icons.qaUpload} label="Importar alumnos" sub="Carga masiva desde archivo" />
                            <QuickAction to="/app/control-escolar/documentos" iconBg="#F3E8FF" iconColor="#6B21A8" icon={Icons.qaFile} label="Generar constancia" sub="Generar constancias en lote" />
                            <QuickAction to="/app/control-escolar/trayectoria" iconBg="#FFEDD5" iconColor="#C2410C" icon={Icons.qaBook} label="Kardex" sub="Consultar kardex por alumno" />
                            <QuickAction to="/app/control-escolar/reinscripciones" iconBg="#DCFCE7" iconColor="#0F6E56" icon={Icons.qaRefresh} label="Reinscribir alumnos" sub="Iniciar proceso de reinscripción" />
                        </div>
                    </div>

                    {/* Alumnos recientes */}
                    <div style={surface}>
                        <p style={surfaceTitle}>
                            Alumnos recientes
                            <Link to="/app/control-escolar/alumnos" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                Ver todos
                            </Link>
                        </p>
                        <div style={{ marginTop: 8 }}>
                            {recientes.map((a, i) => (
                                <div
                                    key={a.matricula}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '12px 0',
                                        borderBottom: i < recientes.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            ...avatarStyle(i),
                                            width: 36, height: 36, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                                        }}
                                    >
                                        {initials(a.nombre)}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {a.nombre}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
                                            {a.matricula} · {a.programa}
                                        </p>
                                        <div style={{ marginTop: 6 }}>
                                            <StatusBadge>{a.estatus}</StatusBadge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div style={surface}>
                    {/* Table top bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                {Icons.search}
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar por nombre, matrícula o programa..."
                                style={{
                                    height: 36, width: 320,
                                    paddingLeft: 34, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, color: '#0f172a', background: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                            Mostrar
                            <select style={{ height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 8px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}>
                                <option>10</option>
                                <option>25</option>
                                <option>50</option>
                            </select>
                            registros
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Matrícula', 'Nombre', 'Programa', 'Semestre', 'Estatus', 'Acciones'].map((h) => (
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
                                {rows.map((r, i) => (
                                    <tr
                                        key={r.matricula}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 10px' }}>
                                            <Link to="/app/expedientes" style={{ color: '#185FA5', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                                                {r.matricula}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.nombre}</td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, color: '#475569' }}>{r.programa}</td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, color: '#64748b' }}>{r.periodo}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <StatusBadge>{r.estatus}</StatusBadge>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { to: '/app/expedientes', icon: Icons.eye, bg: '#EFF6FF', title: 'Ver expediente' },
                                                    { to: '/app/alumnos/crear', icon: Icons.pencil, bg: '#F8FAFC', title: 'Editar' },
                                                    { to: '/app/control-escolar/trayectoria', icon: Icons.tray, bg: '#FFFBEB', title: 'Trayectoria' },
                                                    { to: '/app/control-escolar/reinscripciones', icon: Icons.refresh, bg: '#F0FDF4', title: 'Reinscripción' },
                                                    { to: '/app/control-escolar/documentos', icon: Icons.doc, bg: '#F5F3FF', title: 'Documentos' },
                                                ].map(({ to, icon, bg, title }) => (
                                                    <Link
                                                        key={title}
                                                        to={to}
                                                        title={title}
                                                        style={{
                                                            width: 28, height: 28,
                                                            borderRadius: 6,
                                                            background: bg,
                                                            border: '1px solid #e2e8f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0,
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        {icon}
                                                    </Link>
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
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 10 de 2,124 registros</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['«', '1', '2', '3', '…', '213', '»'].map((p, idx) => (
                                <button
                                    key={idx}
                                    style={{
                                        minWidth: 32, height: 32,
                                        padding: '0 8px',
                                        borderRadius: 6,
                                        border: p === '1' ? 'none' : '1px solid #e2e8f0',
                                        background: p === '1' ? '#185FA5' : 'white',
                                        color: p === '1' ? 'white' : '#475569',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {p}
                                </button>
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
