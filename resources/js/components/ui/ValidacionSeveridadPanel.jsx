import { AlertBox } from './AlertBox';
import { alertTypeFromSeveridad } from '../../utils/validacionInstitucionalUx';

/**
 * Bloque titulado según severidad institucional.
 */
export function ValidacionSeveridadPanel({ titulo, severidad, mensajes = [] }) {
    const lista = mensajes.filter(Boolean);
    if (!lista.length) return null;

    return (
        <div className="grid gap-2">
            {titulo ? (
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#475569' }}>{titulo}</p>
            ) : null}
            {lista.map((msg, idx) => (
                <AlertBox key={`${severidad}-${idx}`} type={alertTypeFromSeveridad(severidad)} message={msg} />
            ))}
        </div>
    );
}
