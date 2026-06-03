import React from 'react';
import { Link } from 'react-router-dom';
import { CeIcons } from '../../../components/controlEscolar';
import { canAlumnos } from './alumnosPermissions';

export function AlumnosEmptyState({ hasFilters, onImport }) {
    const puedeCrear = canAlumnos('crear');
    const puedeImportar = canAlumnos('importar');

    return (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#94a3b8' }}>
                <span style={{ transform: 'scale(2.2)' }}>{CeIcons.folder}</span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {hasFilters ? 'Sin resultados' : 'Aún no hay alumnos registrados'}
            </h3>
            <p style={{ margin: '0 auto 20px', maxWidth: 420, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                {hasFilters
                    ? 'No se encontraron registros que coincidan con los filtros actuales. Ajuste la búsqueda o limpie los filtros.'
                    : 'Comienza registrando un nuevo alumno o importa información desde un archivo validado.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {puedeCrear ? (
                    <Link
                        to="/app/alumnos/crear"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 40,
                            padding: '0 18px',
                            borderRadius: 8,
                            background: '#185FA5',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        {CeIcons.userPlus} Registrar primer alumno
                    </Link>
                ) : null}
                {puedeImportar ? (
                    <button
                        type="button"
                        onClick={onImport}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 40,
                            padding: '0 18px',
                            borderRadius: 8,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            color: '#0f172a',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {CeIcons.upload} Importar desde archivo
                    </button>
                ) : null}
            </div>
        </div>
    );
}
