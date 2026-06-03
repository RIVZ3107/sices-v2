import React from 'react';
import { CeIcons, CeQuickAction, ceTheme } from '../../../components/controlEscolar';
import { canAlumnos } from './alumnosPermissions';

const ACTIONS = [
    { key: 'crear', to: '/app/alumnos/crear', perm: 'crear', icon: CeIcons.userPlus, iconBg: '#DBEAFE', iconColor: '#185FA5', label: 'Nuevo alumno', sub: 'Registrar un nuevo alumno' },
    { key: 'importar', perm: 'importar', icon: CeIcons.upload, iconBg: '#DCFCE7', iconColor: '#0F6E56', label: 'Importar alumnos', sub: 'Carga masiva desde archivo' },
    { key: 'constancia', to: '/app/certificacion/solicitud', perm: 'constancia', icon: CeIcons.file, iconBg: '#F3E8FF', iconColor: '#6B21A8', label: 'Generar constancia', sub: 'Solicitud documental' },
    { key: 'kardex', to: '/app/control-escolar/trayectoria', perm: 'kardex', icon: CeIcons.graduationCap, iconBg: '#FFEDD5', iconColor: '#C2410C', label: 'Kardex', sub: 'Consultar kardex por alumno' },
    { key: 'reinscripcion', to: '/app/control-escolar/reinscripciones', perm: 'reinscripcion', icon: CeIcons.refreshCw, iconBg: '#DCFCE7', iconColor: '#0F6E56', label: 'Reinscribir alumnos', sub: 'Iniciar proceso de reinscripción' },
];

export function AlumnosQuickActions({ onImport }) {
    return (
        <div style={ceTheme.surface}>
            <p style={ceTheme.surfaceTitle}>Acciones rápidas</p>
            <div style={{ marginTop: 8 }}>
                {ACTIONS.map((a) => {
                    if (!canAlumnos(a.perm)) {
                        return null;
                    }
                    if (a.key === 'importar') {
                        return (
                            <button
                                key={a.key}
                                type="button"
                                onClick={onImport}
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 0',
                                    border: 'none',
                                    borderBottom: '1px solid #f1f5f9',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: a.iconBg, color: a.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {a.icon}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{a.label}</p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{a.sub}</p>
                                </div>
                                {CeIcons.chevronRight}
                            </button>
                        );
                    }
                    return (
                        <CeQuickAction
                            key={a.key}
                            to={a.to}
                            iconBg={a.iconBg}
                            iconColor={a.iconColor}
                            icon={a.icon}
                            label={a.label}
                            sub={a.sub}
                        />
                    );
                })}
            </div>
        </div>
    );
}
