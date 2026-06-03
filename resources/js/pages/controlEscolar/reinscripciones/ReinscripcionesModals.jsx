import React, { useEffect, useState } from 'react';
import { controlEscolarApi } from '../../../api/controlEscolar';

function ModalShell({ open, title, children, onClose, footer }) {
    if (!open) return null;
    return (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: 12, maxWidth: 520, width: '100%', padding: 24, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>{title}</h2>
                {children}
                {footer ? <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{footer}</div> : null}
            </div>
        </div>
    );
}

export function ReinscribirAlumnoModal({ open, onClose, onSuccess }) {
    const [elegibles, setElegibles] = useState([]);
    const [alumnoId, setAlumnoId] = useState('');
    const [cicloId, setCicloId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setAlumnoId('');
        setCicloId('');
        setError('');
        void controlEscolarApi.reinscripcionesElegibles().then((res) => setElegibles(res?.data ?? [])).catch(() => setElegibles([]));
    }, [open]);

    const submit = async () => {
        if (!alumnoId || !cicloId) {
            setError('Seleccione alumno y periodo.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const eleg = elegibles.find((x) => String(x.alumno_id) === String(alumnoId));
            const ciclo = cicloId || eleg?.periodo_siguiente_id;
            if (!ciclo) {
                setError('No hay periodo escolar configurado para la reinscripción.');
                setLoading(false);
                return;
            }
            await controlEscolarApi.reinscripcionesCrear({ alumno_id: Number(alumnoId), ciclo_escolar_id: Number(ciclo) });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.message ?? 'No se pudo iniciar la reinscripción.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell open={open} title="Reinscribir alumno" onClose={onClose} footer={(
            <>
                <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                <button type="button" disabled={loading} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontWeight: 600 }}>{loading ? 'Guardando…' : 'Iniciar reinscripción'}</button>
            </>
        )}>
            <p style={{ fontSize: 13, color: '#64748b' }}>Solo alumnos con matrícula activa y continuidad académica en su alcance.</p>
            <select value={alumnoId} onChange={(e) => { setAlumnoId(e.target.value); setCicloId(elegibles.find((x) => String(x.alumno_id) === e.target.value)?.periodo_siguiente_id ?? ''); }} style={{ width: '100%', height: 36, marginTop: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <option value="">Seleccione alumno</option>
                {elegibles.map((a) => <option key={a.alumno_id} value={a.alumno_id}>{a.nombre} — {a.matricula}</option>)}
            </select>
            <input type="hidden" value={cicloId} />
            {alumnoId && elegibles.find((x) => String(x.alumno_id) === alumnoId)?.bloqueos?.length ? (
                <ul style={{ marginTop: 8, fontSize: 12, color: '#BA7517' }}>
                    {elegibles.find((x) => String(x.alumno_id) === alumnoId).bloqueos.map((b) => <li key={b}>{b}</li>)}
                </ul>
            ) : null}
            {error ? <p style={{ color: '#991B1B', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
        </ModalShell>
    );
}

export function DesbloquearReinscripcionModal({ open, onClose, ids, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [comentario, setComentario] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (motivo.trim().length < 5 || comentario.trim().length < 5) {
            setError('Motivo y comentario son obligatorios (mín. 5 caracteres).');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (ids.length === 1) {
                await controlEscolarApi.reinscripcionesDesbloquear(ids[0], { motivo, comentario });
            } else {
                await controlEscolarApi.reinscripcionesDesbloquearMasivo({ ids, motivo, comentario });
            }
            onSuccess?.();
            onClose();
            setMotivo('');
            setComentario('');
        } catch (err) {
            setError(err?.message ?? 'No se pudo desbloquear.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell open={open} title="Desbloquear reinscripción" onClose={onClose} footer={(
            <>
                <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                <button type="button" disabled={loading} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#BA7517', color: '#fff', fontWeight: 600 }}>{loading ? 'Procesando…' : 'Desbloquear'}</button>
            </>
        )}>
            <p style={{ fontSize: 13, color: '#64748b' }}>{ids.length} reinscripción(es) seleccionada(s).</p>
            <input placeholder="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: '100%', height: 36, marginTop: 8, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px' }} />
            <textarea placeholder="Comentario *" value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} style={{ width: '100%', marginTop: 8, borderRadius: 8, border: '1px solid #e2e8f0', padding: 8 }} />
            {error ? <p style={{ color: '#991B1B', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
        </ModalShell>
    );
}

export function ObservarReinscripcionModal({ open, onClose, ids, onSuccess }) {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (motivo.trim().length < 5) {
            setError('El motivo es obligatorio.');
            return;
        }
        setLoading(true);
        try {
            await Promise.all(ids.map((id) => controlEscolarApi.reinscripcionesObservar(id, { motivo })));
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.message ?? 'Error al observar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell open={open} title="Observar reinscripción" onClose={onClose} footer={(
            <>
                <button type="button" onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Cancelar</button>
                <button type="button" disabled={loading} onClick={() => void submit()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#C2410C', color: '#fff', fontWeight: 600 }}>Registrar</button>
            </>
        )}>
            <input placeholder="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px' }} />
            {error ? <p style={{ color: '#991B1B', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
        </ModalShell>
    );
}
