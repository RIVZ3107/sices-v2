import { useState } from 'react';
import { ActionButton } from './ActionButton';

export function AtenderObservacionForm({ onSubmit, disabled = false }) {
    const [observacionId, setObservacionId] = useState('');
    const [estado, setEstado] = useState('atendida');
    const [respuesta, setRespuesta] = useState('');

    async function submit(e) {
        e.preventDefault();
        await onSubmit({ observacionId, payload: { estado, respuesta } });
    }

    return (
        <form className="inst-surface grid gap-2 p-3" onSubmit={submit}>
            <input className="inst-input text-sm" placeholder="ID observacion" value={observacionId} onChange={(e) => setObservacionId(e.target.value)} />
            <select className="inst-select text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="atendida">Atendida</option>
                <option value="descartada">Descartada</option>
            </select>
            <textarea className="inst-textarea text-sm" rows={2} placeholder="Respuesta" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} />
            <div><ActionButton type="submit" disabled={disabled || !observacionId}>Atender observacion</ActionButton></div>
        </form>
    );
}
