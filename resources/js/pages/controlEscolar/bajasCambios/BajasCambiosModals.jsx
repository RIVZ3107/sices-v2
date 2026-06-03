import React, { useEffect, useState } from 'react';
import { controlEscolarApi } from '../../../api/controlEscolar';
import { sanitizeInstitutionalMessage } from '../../../utils/uxInstitucional';

const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 };
const panel = { background: 'white', borderRadius: 12, padding: 24, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' };
const field = { width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13 };
const label = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 };

const TIPOS = [
    { value: 'baja_temporal', label: 'Baja temporal' },
    { value: 'baja_definitiva', label: 'Baja definitiva' },
    { value: 'cambio_grupo', label: 'Cambio de grupo' },
    { value: 'cambio_turno', label: 'Cambio de turno' },
    { value: 'cambio_programa', label: 'Cambio de programa' },
];

export function NuevaSolicitudBajaCambioModal({ open, tipoInicial, onClose, onSuccess }) {
    const [search, setSearch] = useState('');
    const [alumnos, setAlumnos] = useState([]);
    const [alumnoSel, setAlumnoSel] = useState(null);
    const [tipo, setTipo] = useState(tipoInicial || 'baja_temporal');
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [grupoDestino, setGrupoDestino] = useState('');
    const [turnoDestino, setTurnoDestino] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setTipo(tipoInicial || 'baja_temporal');
            setError('');
        } else {
            setSearch(''); setAlumnos([]); setAlumnoSel(null); setMotivo(''); setDescripcion('');
        }
    }, [open, tipoInicial]);

    useEffect(() => {
        if (!open || search.trim().length < 2) { setAlumnos([]); return; }
        const t = setTimeout(() => {
            controlEscolarApi.alumnos({ search: search.trim(), per_page: 8 })
                .then((res) => setAlumnos(res?.data?.data ?? res?.data ?? []))
                .catch(() => setAlumnos([]));
        }, 350);
        return () => clearTimeout(t);
    }, [open, search]);

    if (!open) return null;

    const guardar = async () => {
        if (!alumnoSel?.matricula_id) { setError('Seleccione un alumno con matrícula.'); return; }
        if (!motivo.trim()) { setError('El motivo es obligatorio.'); return; }
        setLoading(true);
        setError('');
        try {
            const body = {
                alumno_id: alumnoSel.id,
                matricula_id: alumnoSel.matricula_id,
                tipo_cambio: tipo,
                motivo,
                descripcion: descripcion || undefined,
                documentacion_completa: tipo !== 'baja_definitiva',
            };
            if (tipo === 'cambio_grupo' && grupoDestino) body.grupo_destino_id = Number(grupoDestino);
            if (tipo === 'cambio_turno') body.turno_destino = turnoDestino;
            await controlEscolarApi.bajasCambiosCrear(body);
            onSuccess?.('Solicitud registrada correctamente.');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo registrar la solicitud.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 16px' }}>Nueva solicitud</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <div style={{ marginBottom: 12 }}>
                    <label style={label}>Tipo</label>
                    <select style={field} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label style={label}>Buscar alumno</label>
                    <input style={field} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, matrícula o CURP…" />
                    {alumnos.map((a) => (
                        <button key={a.id} type="button" onClick={() => { setAlumnoSel(a); setSearch(a.nombre_completo ?? a.nombre ?? ''); setAlumnos([]); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: 8, border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: 13 }}>
                            {a.nombre_completo ?? [a.nombre, a.primer_apellido].filter(Boolean).join(' ')} — {a.matricula ?? a.matricula_actual}
                        </button>
                    ))}
                </div>
                <div style={{ marginBottom: 12 }}><label style={label}>Motivo</label><input style={field} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
                <div style={{ marginBottom: 12 }}><label style={label}>Descripción</label><textarea style={{ ...field, height: 72, padding: 8 }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
                {tipo === 'cambio_grupo' ? <div style={{ marginBottom: 12 }}><label style={label}>ID grupo destino</label><input style={field} value={grupoDestino} onChange={(e) => setGrupoDestino(e.target.value)} /></div> : null}
                {tipo === 'cambio_turno' ? <div style={{ marginBottom: 12 }}><label style={label}>Turno destino</label><input style={field} value={turnoDestino} onChange={(e) => setTurnoDestino(e.target.value)} /></div> : null}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void guardar()} style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600 }}>
                        {loading ? 'Guardando…' : 'Registrar solicitud'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AprobarBajaCambioModal({ open, solicitud, ids, onClose, onSuccess }) {
    const [dictamen, setDictamen] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { if (!open) { setDictamen(''); setError(''); } }, [open]);
    if (!open) return null;

    const enviar = async () => {
        if (!dictamen.trim()) { setError('El dictamen o comentario es obligatorio.'); return; }
        setLoading(true);
        try {
            if (ids?.length > 1) {
                await controlEscolarApi.bajasCambiosAprobarMasivo({ ids, dictamen });
            } else {
                const id = solicitud?.id ?? ids?.[0];
                await controlEscolarApi.bajasCambiosAprobar(id, { dictamen });
            }
            onSuccess?.('Solicitud(es) aprobada(s).');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo aprobar.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 12px' }}>Aprobar solicitud</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <textarea style={{ ...field, height: 100, padding: 8 }} value={dictamen} onChange={(e) => setDictamen(e.target.value)} placeholder="Dictamen institucional…" />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void enviar()} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px' }}>{loading ? '…' : 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
}

export function RechazarBajaCambioModal({ open, solicitud, ids, onClose, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [comentario, setComentario] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { if (!open) { setMotivo(''); setComentario(''); setError(''); } }, [open]);
    if (!open) return null;

    const enviar = async () => {
        if (!motivo.trim() || !comentario.trim()) { setError('Motivo y comentario son obligatorios.'); return; }
        setLoading(true);
        try {
            if (ids?.length > 1) {
                await controlEscolarApi.bajasCambiosRechazarMasivo({ ids, motivo, comentario });
            } else {
                await controlEscolarApi.bajasCambiosRechazar(solicitud?.id ?? ids[0], { motivo, comentario });
            }
            onSuccess?.('Solicitud(es) rechazada(s).');
            onClose();
        } catch (err) {
            setError(sanitizeInstitutionalMessage(err?.message, 'No se pudo rechazar.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3 style={{ margin: '0 0 12px' }}>Rechazar solicitud</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <input style={{ ...field, marginBottom: 8 }} placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                <textarea style={{ ...field, height: 80, padding: 8 }} placeholder="Comentario institucional" value={comentario} onChange={(e) => setComentario(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void enviar()} style={{ background: '#991B1B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px' }}>{loading ? '…' : 'Rechazar'}</button>
                </div>
            </div>
        </div>
    );
}

export function ObservarBajaCambioModal({ open, solicitud, onClose, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    if (!open || !solicitud) return null;

    const enviar = async () => {
        if (!motivo.trim() || !descripcion.trim()) { setError('Complete motivo y descripción.'); return; }
        setLoading(true);
        try {
            await controlEscolarApi.bajasCambiosObservar(solicitud.id, { motivo, descripcion });
            onSuccess?.('Observación registrada.');
            onClose();
        } catch (err) {
            setError(err?.message ?? 'Error al observar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlay}>
            <div style={panel}>
                <h3>Observar solicitud</h3>
                {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
                <input style={{ ...field, marginBottom: 8 }} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo" />
                <textarea style={{ ...field, height: 80, padding: 8 }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void enviar()}>Registrar</button>
                </div>
            </div>
        </div>
    );
}
