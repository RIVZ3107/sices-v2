import React, { useEffect, useState } from 'react';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { CeIcons } from '../../../components/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16,
};
const panel = { background: 'white', borderRadius: 12, padding: 24, maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto' };

export function CalificacionCapturaModal({ open, grupoKey, onClose, onSuccess, ventanaAbierta }) {
    const [alumnos, setAlumnos] = useState([]);
    const [draft, setDraft] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !grupoKey) return;
        setLoading(true);
        setError('');
        controlEscolarApi.calificacionesAlumnos(grupoKey)
            .then((res) => {
                const list = res?.data ?? [];
                setAlumnos(list);
                const init = {};
                list.forEach((a) => { init[a.materia_cursada_id] = { calificacion: a.calificacion ?? '', observaciones: a.observaciones ?? '' }; });
                setDraft(init);
            })
            .catch((err) => setError(err?.message ?? 'No se pudo cargar alumnos.'))
            .finally(() => setLoading(false));
    }, [open, grupoKey]);

    if (!open) return null;

    const guardar = async () => {
        if (!ventanaAbierta) {
            setError('La ventana de captura está cerrada.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const calificaciones = Object.entries(draft).map(([id, v]) => ({
                materia_cursada_id: Number(id),
                calificacion: v.calificacion,
                observaciones: v.observaciones || undefined,
            }));
            await controlEscolarApi.calificacionesCapturar(grupoKey, { calificaciones });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudieron guardar las calificaciones.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 16px' }}>Capturar calificaciones</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                {loading ? <p>Cargando alumnos…</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Matrícula', 'Alumno', 'Calificación', 'Observaciones'].map((h) => (
                                    <th key={h} style={{ padding: 8, textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {alumnos.map((a) => (
                                <tr key={a.materia_cursada_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: 8 }}>{a.matricula}</td>
                                    <td style={{ padding: 8 }}>{a.nombre}</td>
                                    <td style={{ padding: 8 }}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="10"
                                            value={draft[a.materia_cursada_id]?.calificacion ?? ''}
                                            onChange={(e) => setDraft((d) => ({
                                                ...d,
                                                [a.materia_cursada_id]: { ...d[a.materia_cursada_id], calificacion: e.target.value },
                                            }))}
                                            style={{ width: 72, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', padding: '0 8px' }}
                                        />
                                    </td>
                                    <td style={{ padding: 8 }}>
                                        <input
                                            type="text"
                                            value={draft[a.materia_cursada_id]?.observaciones ?? ''}
                                            onChange={(e) => setDraft((d) => ({
                                                ...d,
                                                [a.materia_cursada_id]: { ...d[a.materia_cursada_id], observaciones: e.target.value },
                                            }))}
                                            style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #e2e8f0', padding: '0 8px' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                    <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                    <button type="button" onClick={guardar} disabled={saving || loading} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {saving ? 'Guardando…' : 'Guardar calificaciones'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ImportarCalificacionesModal({ open, grupoKey, onClose, onSuccess, ventanaAbierta }) {
    const [archivo, setArchivo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setArchivo(null);
            setPreview(null);
            setError('');
        }
    }, [open]);

    if (!open) return null;

    const ejecutarPreview = async () => {
        if (!archivo) return;
        setLoading(true);
        setError('');
        const fd = new FormData();
        fd.append('archivo', archivo);
        fd.append('preview', '1');
        if (grupoKey) fd.append('grupo_materia', grupoKey);
        try {
            const res = await controlEscolarApi.calificacionesImportar(fd);
            setPreview(res?.data ?? null);
        } catch (err) {
            setError(err?.message ?? 'Error al validar archivo.');
        } finally {
            setLoading(false);
        }
    };

    const confirmar = async () => {
        if (!ventanaAbierta) {
            setError('La ventana de captura está cerrada.');
            return;
        }
        if (!archivo) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('archivo', archivo);
        fd.append('confirmar', '1');
        if (grupoKey) fd.append('grupo_materia', grupoKey);
        try {
            await controlEscolarApi.calificacionesImportar(fd);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.message ?? 'Error al importar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 12px' }}>Importar calificaciones</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}>Archivo CSV con columnas: matricula, calificacion, observaciones.</p>
                <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                    <button type="button" onClick={() => controlEscolarApi.calificacionesPlantilla(grupoKey ? { grupo_materia: grupoKey } : {})} style={{ fontSize: 12, color: '#185FA5', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        Descargar plantilla
                    </button>
                </div>
                <input type="file" accept=".csv,.txt" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                {preview ? (
                    <p style={{ fontSize: 13, marginTop: 12 }}>
                        Válidos: <strong>{preview.validas}</strong> · Inválidos: <strong>{preview.invalidas}</strong>
                    </p>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                    <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                    <button type="button" onClick={ejecutarPreview} disabled={!archivo || loading} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Validar</button>
                    <button type="button" onClick={confirmar} disabled={!preview || loading} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {loading ? 'Importando…' : 'Confirmar importación'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SolicitarCorreccionModal({ open, materiaCursadaId, onClose, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const enviar = async () => {
        if (!motivo.trim() || !descripcion.trim()) {
            setError('Motivo y descripción son obligatorios.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await controlEscolarApi.calificacionesSolicitarCorreccion(materiaCursadaId, { motivo, descripcion });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.message ?? 'No se pudo registrar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={{ ...panel, maxWidth: 480 }}>
                <h3 style={{ margin: '0 0 12px' }}>Solicitar corrección</h3>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Motivo</label>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: '100%', height: 36, marginBottom: 12, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px' }} />
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Descripción</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: 10 }} />
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                    <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                    <button type="button" onClick={enviar} disabled={loading} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#BA7517', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {loading ? 'Enviando…' : 'Enviar solicitud'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CalificacionesHistorialModal({ open, grupoKey, onClose }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const params = grupoKey ? { grupo_materia: grupoKey } : {};
        controlEscolarApi.calificacionesHistorial(params)
            .then((res) => setItems(res?.data?.data ?? []))
            .finally(() => setLoading(false));
    }, [open, grupoKey]);

    if (!open) return null;

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 16px' }}>Historial de calificaciones</h3>
                {loading ? <p>Cargando…</p> : items.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Sin movimientos registrados.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {items.map((h) => (
                            <li key={h.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                <strong>{h.alumno}</strong> · {h.materia}<br />
                                <span style={{ color: '#64748b' }}>{h.valor_anterior ?? '—'} → {h.valor_nuevo ?? '—'} · {h.usuario}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}
