import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export function SpaNotFoundPage() {
    return (
        <section className="inst-surface p-8 max-w-lg mx-auto text-center grid gap-4">
            <h1 className="inst-title text-lg">Página no encontrada</h1>
            <p className="inst-muted text-sm">
                La ruta solicitada no existe en SICES v2 o no tienes acceso a ella.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                <Link to="/app/dashboard" className="inst-btn inst-btn-primary text-sm">
                    Ir al inicio
                </Link>
                <Link to="/app/certificacion/dashboard" className="inst-btn inst-btn-secondary text-sm">
                    Certificación
                </Link>
            </div>
        </section>
    );
}

function isSpa404(error) {
    if (isRouteErrorResponse(error) && error.status === 404) {
        return true;
    }
    const msg = String(error?.message ?? error?.statusText ?? error?.data ?? '');
    return /404|not found|no routes matched/i.test(msg);
}

export function SpaRouteErrorPage() {
    const error = useRouteError();

    if (isSpa404(error)) {
        return <SpaNotFoundPage />;
    }

    const message = isRouteErrorResponse(error)
        ? error.statusText || error.data?.message || 'No se pudo completar la operación.'
        : error?.message || 'Ocurrió un error inesperado en la aplicación.';

    return (
        <section className="inst-surface p-8 max-w-lg mx-auto text-center grid gap-4">
            <h1 className="inst-title text-lg">Error en la aplicación</h1>
            <p className="inst-muted text-sm">{message}</p>
            <div className="flex flex-wrap justify-center gap-2">
                <Link to="/app/dashboard" className="inst-btn inst-btn-primary text-sm">
                    Ir al inicio
                </Link>
                <button
                    type="button"
                    className="inst-btn inst-btn-secondary text-sm"
                    onClick={() => window.location.reload()}
                >
                    Reintentar
                </button>
            </div>
        </section>
    );
}
