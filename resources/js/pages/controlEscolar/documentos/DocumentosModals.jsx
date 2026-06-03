import React, { useEffect, useState } from 'react';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16,
};
const panel = { background: 'white', borderRadius: 12, padding: 24, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' };
const field = { width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13 };
const label = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 };

function fieldErrors(err, key) {
    const e = err?.errors?.[key] ?? err?.original?.response?.data?.errors?.[key];
    if (!e) return null;
    return Array.isArray(e) ? e[0] : e;
}

export function IniciarSolicitudDocumentalModal({ open, tipos, onClose, onSuccess }) {
    const [search, setSearch] = useState('');
    const [alumnos, setAlumnos] = useState([]);
    const [alumnoSel, setAlumnoSel] = useState(null);
    const [tipo, setTipo] = useState('');
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [enviar, setEnviar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setSearch('');
            setAlumnos([]);
            setAlumnoSel(null);
            setTipo('');
            setMotivo('');
            setObservaciones('');
            setEnviar(false);
            setError('');
        }
    }, [open]);

    useEffect(() => {
        if (!open || search.trim().length < 2) {
            setAlumnos([]);
            return;
        }
        const t = setTimeout(() => {
            setBuscando(true);
            controlEscolarApi.alumnos({ search: search.trim(), per_page: 8 })
                .then((res) => setAlumnos(res?.data?.data ?? res?.data ?? []))
                .catch(() => setAlumnos([]))
                .finally(() => setBuscando(false));
        }, 350);
        return () => clearTimeout(t);
    }, [open, search]);

    if (!open) return null;

    const guardar = async () => {
        if (!alumnoSel?.id || !alumnoSel?.matricula_id) {
            setError('Seleccione un alumno con matrícula vigente.');
            return;
        }
        if (!tipo) {
            setError('Seleccione el tipo de documento.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await controlEscolarApi.documentosCrear({
                alumno_id: alumnoSel.id,
                matricula_id: alumnoSel.matricula_id,
                tipo_documento_id: tipo,
                motivo: motivo || undefined,
                observaciones: observaciones || undefined,
                enviar_validacion: enviar,
            });
            onSuccess?.('Solicitud documental registrada correctamente.');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo registrar la solicitud.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay} role="dialog" aria-modal="true">
            <div style={panel}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Iniciar solicitud documental</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13, marginBottom: 12 }}>{error}</p> : null}
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>Buscar alumno (nombre, matrícula o CURP)</label>
                    <input style={field} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Escriba al menos 2 caracteres…" />
                    {buscando ? <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Buscando…</p> : null}
                    {alumnos.length > 0 ? (
                        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 160, overflow: 'auto' }}>
                            {alumnos.map((a) => (
                                <li key={a.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAlumnoSel(a);
                                            setSearch(a.nombre_completo ?? a.nombre ?? '');
                                            setAlumnos([]);
                                        }}
                                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: alumnoSel?.id === a.id ? '#EFF6FF' : 'white', cursor: 'pointer', fontSize: 13 }}
                                    >
                                        <div style={{ fontWeight: 600 }}>{a.nombre_completo ?? [a.nombre, a.primer_apellido].filter(Boolean).join(' ')}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{a.matricula ?? a.matricula_actual} · {a.curp_enmascarada ?? a.curp ?? ''}</div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>Tipo de documento</label>
                    <select style={field} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="">Seleccione…</option>
                        {(tipos ?? []).map((t) => (
                            <option key={t.codigo ?? t.id} value={t.codigo ?? t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>Motivo o finalidad</label>
                    <textarea style={{ ...field, height: 72, padding: 8 }} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>Observaciones internas</label>
                    <textarea style={{ ...field, height: 56, padding: 8 }} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
                    <input type="checkbox" checked={enviar} onChange={(e) => setEnviar(e.target.checked)} />
                    Enviar a validación al guardar
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void guardar()} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {loading ? 'Guardando…' : 'Guardar solicitud'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function EnviarValidacionDocumentoModal({ open, documento, onClose, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { if (!open) { setMotivo(''); setError(''); } }, [open]);
    if (!open || !documento) return null;

    const enviar = async () => {
        setLoading(true);
        setError('');
        try {
            await controlEscolarApi.documentosEnviarValidacion(documento.id, { motivo: motivo || undefined });
            onSuccess?.('Solicitud enviada a validación.');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo enviar a validación.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 12px' }}>Enviar a validación</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}>Confirme el envío de la solicitud de {documento.tipo_documento ?? documento.tipo}.</p>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <textarea style={{ ...field, height: 64, marginTop: 12, padding: 8 }} placeholder="Comentario opcional…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white' }}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void enviar()} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontWeight: 600 }}>
                        {loading ? 'Enviando…' : 'Confirmar envío'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AtenderObservacionDocumentoModal({ open, documento, onClose, onSuccess }) {
    const [respuesta, setRespuesta] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { if (!open) { setRespuesta(''); setError(''); } }, [open]);
    if (!open || !documento) return null;

    const enviar = async () => {
        if (!respuesta.trim()) {
            setError('La respuesta es obligatoria.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await controlEscolarApi.documentosAtenderObservacion(documento.id, { respuesta });
            onSuccess?.('Observación atendida correctamente.');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo atender la observación.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 12px' }}>Atender observación</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <textarea style={{ ...field, height: 120, padding: 8 }} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Describa las correcciones realizadas…" />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white' }}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void enviar()} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontWeight: 600 }}>
                        {loading ? 'Guardando…' : 'Atender y reenviar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CancelarDocumentoModal({ open, documento, onClose, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { if (!open) { setMotivo(''); setError(''); } }, [open]);
    if (!open || !documento) return null;

    const cancelar = async () => {
        if (!motivo.trim()) {
            setError('El motivo de cancelación es obligatorio.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await controlEscolarApi.documentosCancelar(documento.id, { motivo });
            onSuccess?.('Solicitud cancelada.');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo cancelar la solicitud.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 12px' }}>Cancelar solicitud</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}>Esta acción no se puede deshacer.</p>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <textarea style={{ ...field, height: 96, marginTop: 12, padding: 8 }} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo institucional…" />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white' }}>Volver</button>
                    <button type="button" disabled={loading} onClick={() => void cancelar()} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: '#991B1B', color: 'white', fontWeight: 600 }}>
                        {loading ? 'Cancelando…' : 'Confirmar cancelación'}
                    </button>
                </div>
            </div>
        </div>
    );
}
