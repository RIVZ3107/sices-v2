import { Link } from 'react-router-dom';
import { MSG_ACCESO_DENEGADO } from '../../utils/uxInstitucional';

/**
 * Pantalla institucional para rutas o módulos sin permiso (sin errores técnicos).
 */
export function InstitutionalAccessDenied({ message = MSG_ACCESO_DENEGADO }) {
    return (
        <section className="inst-surface p-8 max-w-lg mx-auto text-center grid gap-4">
            <h1 className="inst-title text-lg">Acceso no autorizado</h1>
            <p className="inst-muted text-sm">{message}</p>
            <div className="flex flex-wrap justify-center gap-2">
                <Link to="/app/dashboard" className="inst-btn inst-btn-primary text-sm">
                    Ir al inicio
                </Link>
            </div>
        </section>
    );
}
