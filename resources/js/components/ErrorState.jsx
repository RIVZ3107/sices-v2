import { sanitizeInstitutionalMessage } from '../utils/uxInstitucional';

export function ErrorState({
    message = 'No fue posible completar la operación. Intente nuevamente o contacte al administrador del sistema.',
}) {
    const texto = sanitizeInstitutionalMessage(message);
    return (
        <div className="inst-surface p-4 text-sm text-rose-700">
            {texto}
        </div>
    );
}
