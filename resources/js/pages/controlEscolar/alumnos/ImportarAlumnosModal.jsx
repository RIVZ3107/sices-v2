import React, { useState } from 'react';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { CeIcons } from '../../../components/controlEscolar';

export function ImportarAlumnosModal({ open, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    if (!open) {
        return null;
    }

    const submit = async () => {
        if (!file) {
            setError('Seleccione un archivo CSV.');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await controlEscolarApi.alumnosImportar(file);
            setResult(res?.data ?? res);
            onSuccess?.();
        } catch (err) {
            setError(err?.message ?? 'No se pudo importar el archivo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{ background: '#fff', borderRadius: 12, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Importar alumnos</h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                    Archivo CSV con columnas: curp, nombre, primer_apellido, segundo_apellido (opcional), estatus (opcional).
                </p>
                <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null);
                        setResult(null);
                        setError('');
                    }}
                    style={{ width: '100%', fontSize: 13, marginBottom: 12 }}
                />
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                {result ? (
                    <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#166534', marginBottom: 12 }}>
                        Insertados: {result.insertados ?? 0}. Omitidos: {result.omitidos ?? 0}.
                        {(result.errores ?? []).length > 0 ? (
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                {result.errores.slice(0, 5).map((e, i) => (
                                    <li key={i}>Fila {e.fila}: {e.mensaje}</li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                        Cerrar
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => void submit()}
                        style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}
                    >
                        {loading ? 'Importando…' : 'Importar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
