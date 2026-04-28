import { useState } from 'react';
import { ActionButton } from './ActionButton';

export function ObservacionForm({ onSubmit, disabled = false }) {
    const [tipo, setTipo] = useState('general');
    const [seccion, setSeccion] = useState('revision');
    const [observacion, setObservacion] = useState('');
    const [prioridad, setPrioridad] = useState('media');

    async function submit(e) {
        e.preventDefault();
        await onSubmit({ tipo, seccion, observacion, prioridad });
        setObservacion('');
    }

    return (
        <form className="grid gap-2 rounded border border-slate-200 p-3" onSubmit={submit}>
            <div className="grid gap-2 md:grid-cols-3">
                <input className="rounded border border-slate-300 px-2 py-1 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Tipo" />
                <input className="rounded border border-slate-300 px-2 py-1 text-sm" value={seccion} onChange={(e) => setSeccion(e.target.value)} placeholder="Seccion" />
                <select className="rounded border border-slate-300 px-2 py-1 text-sm" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                </select>
            </div>
            <textarea className="rounded border border-slate-300 px-2 py-1 text-sm" rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Observacion" />
            <div><ActionButton type="submit" disabled={disabled || !observacion.trim()}>Registrar observacion</ActionButton></div>
        </form>
    );
}
