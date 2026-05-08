import { useState } from 'react';
import { ActionButton } from './ActionButton';

export function AtenderObservacionForm({ onSubmit, disabled = false, observacionId = '' }) {
    const [estado, setEstado] = useState('atendida');
    const [respuesta, setRespuesta] = useState('');

    async function submit(e) {
        e.preventDefault();
        await onSubmit({ observacionId, payload: { estado, respuesta } });
    }

    return (
        <form className="inst-surface grid gap-2 p-3" onSubmit={submit}>
            <div className="subtle-help-text">Observación seleccionada para atención.</div>
            <select className="inst-select text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="atendida">Atendida</option>
                <option value="descartada">Descartada</option>
            </select>
            <textarea className="inst-textarea text-sm" rows={2} placeholder="Respuesta" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} />
            <div><ActionButton type="submit" disabled={disabled || !observacionId || respuesta.trim().length < 5}>Atender observación</ActionButton></div>
        </form>
    );
}
