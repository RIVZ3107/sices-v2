import React from 'react';
import { Link } from 'react-router-dom';
import { CeIcons, CeStatusBadge, ceAvatarStyle, ceInitials, ceTheme } from '../../../components/controlEscolar';
import { sanitizeInstitutionalLabel } from '../../../utils/uxInstitucional';

export function AlumnosRecentesCard({ recientes, loading }) {
    const tiene = recientes?.length > 0;

    return (
        <div style={ceTheme.surface}>
            <p style={ceTheme.surfaceTitle}>
                Alumnos recientes
                {tiene ? (
                    <Link to="/app/control-escolar/alumnos" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                        Ver todos
                    </Link>
                ) : null}
            </p>
            {loading && !tiene ? (
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '12px 0 0' }}>Cargando…</p>
            ) : null}
            {!loading && !tiene ? (
                <div style={{ textAlign: 'center', padding: '20px 8px', color: '#94a3b8' }}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{CeIcons.users}</div>
                    <p style={{ fontSize: 12, margin: 0 }}>Aún no hay alumnos registrados.</p>
                </div>
            ) : null}
            <div style={{ marginTop: 8 }}>
                {(recientes ?? []).map((a, i) => (
                    <Link
                        key={a.alumno_id ?? i}
                        to={a.expediente_url ?? `/app/alumnos/${a.alumno_id}/expediente`}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '12px 0',
                            borderBottom: i < recientes.length - 1 ? '1px solid #f1f5f9' : 'none',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <div style={{ ...ceAvatarStyle(i), width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {ceInitials(a.nombre)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sanitizeInstitutionalLabel(a.nombre)}
                            </p>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                                {a.matricula} · {sanitizeInstitutionalLabel(a.programa)}
                            </p>
                            <div style={{ marginTop: 6 }}>
                                <CeStatusBadge>{a.estatus}</CeStatusBadge>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
