import React, { useState } from 'react';
import { controlEscolarApi } from '../../../api/controlEscolar';

function ModalShell({ open, title, children, onClose, footer }) {
    if (!open) {
        return null;
    }
    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
            onClick={onClose}
        >
            <div style={{ background: '#fff', borderRadius: 12, maxWidth: 480, width: '100%', padding: 24 }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>{title}</h2>
                {children}
                {footer ? <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{footer}</div> : null}
            </div>
        </div>
    );
}

export function CrearExpedienteModal({ open, onClose, onSuccess }) {
    const [alumnoId, setAlumnoId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!alumnoId) {
            setError('Indique el ID del alumno.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await controlEscolarApi.expedientesCrear({ alumno_id: Number(alumnoId) });
            onSuccess?.();
            onClose();
            setAlumnoId('');
        } catch (err) {
            setError(err?.message ?? 'No se pudo crear el expediente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell
            open={open}
            title="Crear expediente"
            onClose={onClose}
            footer={(
                <>
                    <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontWeight: 600 }}>
                        {loading ? 'Guardando…' : 'Crear'}
                    </button>
                </>
            )}
        >
            <p style={{ fontSize: 13, color: '#64748b' }}>Registre el expediente operativo para un alumno de su alcance.</p>
            <label style={{ display: 'block', marginTop: 12, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                ID del alumno
                <input type="number" value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px' }} />
            </label>
            {error ? <p style={{ color: '#991B1B', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
        </ModalShell>
    );
}

export function CargarDocumentoModal({ open, onClose, alumnoId, onSuccess }) {
    const [tipo, setTipo] = useState('constancia_estudios');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!alumnoId || !file) {
            setError('Seleccione expediente y archivo.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('tipo_documento', tipo);
            fd.append('archivo', file);
            await controlEscolarApi.expedientesCargarDocumento(alumnoId, fd);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.message ?? 'No se pudo cargar el documento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell
            open={open}
            title="Cargar documento"
            onClose={onClose}
            footer={(
                <>
                    <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontWeight: 600 }}>
                        {loading ? 'Subiendo…' : 'Cargar'}
                    </button>
                </>
            )}
        >
            <p style={{ fontSize: 13, color: '#64748b' }}>Expediente: {alumnoId ? `EXP-${String(alumnoId).padStart(6, '0')}` : '—'}</p>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: '100%', height: 36, marginTop: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <option value="matricula">Matrícula activa</option>
                <option value="inscripcion">Inscripción de periodo</option>
                <option value="carga">Carga académica</option>
                <option value="calificaciones">Calificaciones capturadas</option>
                <option value="documento">Documento académico</option>
            </select>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ marginTop: 12, width: '100%' }} />
            {error ? <p style={{ color: '#991B1B', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
        </ModalShell>
    );
}

export function ObservarExpedienteModal({ open, onClose, alumnoIds, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (motivo.trim().length < 5) {
            setError('El motivo es obligatorio (mínimo 5 caracteres).');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (alumnoIds.length === 1) {
                await controlEscolarApi.expedientesObservar(alumnoIds[0], { motivo, descripcion });
            } else {
                await controlEscolarApi.expedientesObservarMasivo({ ids: alumnoIds, motivo, descripcion });
            }
            onSuccess?.();
            onClose();
            setMotivo('');
        } catch (err) {
            setError(err?.message ?? 'No se pudo registrar la observación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell
            open={open}
            title="Observar expediente"
            onClose={onClose}
            footer={(
                <>
                    <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                    <button type="button" disabled={loading} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#BA7517', color: '#fff', fontWeight: 600 }}>
                        {loading ? 'Guardando…' : 'Registrar'}
                    </button>
                </>
            )}
        >
            <p style={{ fontSize: 13, color: '#64748b' }}>{alumnoIds.length} expediente(s) seleccionado(s).</p>
            <input placeholder="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: '100%', height: 36, marginTop: 8, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px' }} />
            <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} style={{ width: '100%', marginTop: 8, borderRadius: 8, border: '1px solid #e2e8f0', padding: 8 }} />
            {error ? <p style={{ color: '#991B1B', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
        </ModalShell>
    );
}

export function ValidarExpedienteModal({ open, onClose, alumnoIds, rows, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const bloqueados = rows.filter((r) => !r.puede_validar);

    const submit = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
            if (alumnoIds.length === 1) {
                await controlEscolarApi.expedientesValidar(alumnoIds[0], {});
                onSuccess?.();
                onClose();
            } else {
                const res = await controlEscolarApi.expedientesValidarMasivo({ ids: alumnoIds });
                setResult(res?.data ?? res);
                if ((res?.data?.bloqueados ?? []).length === 0) {
                    onSuccess?.();
                    onClose();
                }
            }
        } catch (err) {
            const msg = err?.legacy?.message ?? err?.message;
            setError(msg ?? 'No se pudo validar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell
            open={open}
            title="Validar expediente"
            onClose={onClose}
            footer={(
                <>
                    <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                    <button type="button" disabled={loading || bloqueados.length === alumnoIds.length} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600 }}>
                        {loading ? 'Validando…' : 'Confirmar validación'}
                    </button>
                </>
            )}
        >
            {bloqueados.length > 0 ? (
                <div style={{ padding: 12, background: '#FEF3C7', borderRadius: 8, fontSize: 12, marginBottom: 8 }}>
                    {bloqueados.map((b) => (
                        <div key={b.alumno_id}>
                            <strong>{b.folio}</strong>: {(b.bloqueos_validacion ?? []).join(' ')}
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: 13, color: '#64748b' }}>Se validarán {alumnoIds.length} expediente(s) que cumplan requisitos.</p>
            )}
            {result?.bloqueados?.length ? (
                <p style={{ fontSize: 12, color: '#991B1B' }}>Bloqueados: {result.bloqueados.length}. Procesados: {result.procesados}.</p>
            ) : null}
            {error ? <p style={{ color: '#991B1B', fontSize: 13 }}>{error}</p> : null}
        </ModalShell>
    );
}
