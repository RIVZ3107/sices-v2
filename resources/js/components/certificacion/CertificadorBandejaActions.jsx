import { Link } from 'react-router-dom';
import { filtrarAccionesCertificador } from '../../utils/certificadorUx';

const linkStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: '#185FA5',
    textDecoration: 'none',
    marginRight: 8,
    display: 'inline-block',
};

/**
 * Acciones de bandeja del Certificador: solo navegación (sin ejecutar workflow desde la tabla).
 */
export function CertificadorBandejaActions({ row }) {
    const alumnoId = row.alumno?.id;
    const acciones = filtrarAccionesCertificador(row?.workflow_resumen?.acciones_permitidas ?? []);

    return (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {alumnoId ? (
                <Link to={`/app/alumnos/${alumnoId}/expediente`} style={linkStyle}>
                    Ver expediente
                </Link>
            ) : null}
            <Link to={`/app/documentos/${row.id}`} style={linkStyle}>
                Ver solicitud
            </Link>
            {acciones.some((a) => a.accion === 'validar_informacion') ? (
                <Link to={`/app/documentos/${row.id}`} style={linkStyle}>
                    Validar información
                </Link>
            ) : null}
            {acciones.some((a) => a.accion === 'devolver_observaciones') ? (
                <Link to={`/app/documentos/${row.id}?accion=devolver`} style={{ ...linkStyle, color: '#991b1b' }}>
                    Devolver con observaciones
                </Link>
            ) : null}
        </span>
    );
}
