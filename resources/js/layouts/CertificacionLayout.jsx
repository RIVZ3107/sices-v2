import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { debeUsarLayoutCertificacionRc, NORMALES_CERTIFICACION_PATH } from '../utils/certificacionRoutes';

/**
 * Wrapper sin navegación lateral: el menú global (SidebarPro) es la única navegación.
 * Educación Superior no usa rutas /app/certificacion/* salvo redirección a supervisión ES.
 */
export function CertificacionLayout() {
    const location = useLocation();

    if (!debeUsarLayoutCertificacionRc()) {
        let destino = NORMALES_CERTIFICACION_PATH;
        if (location.pathname.includes('/revision')) {
            destino =
                location.pathname.replace('/app/certificacion', '/app/educacion-superior') + location.search;
        }
        return <Navigate to={destino} replace />;
    }

    return <Outlet />;
}
