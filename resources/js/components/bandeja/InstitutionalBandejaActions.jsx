import { Link } from 'react-router-dom';
import {
    bandejaAcciones,
    ejecutarAccionBandeja,
} from '../../utils/bandejaWorkflow';
import { uxLinkIncidenciaTecnica } from '../../utils/uxInstitucional';

const ACCION_PATH = {
    enviar_validacion: (id) => `/app/documentos/${id}`,
    validar_informacion: (id) => `/app/documentos/${id}`,
    devolver_observaciones: (id) => `/app/documentos/${id}`,
    aprobar_expediente: (id) => `/app/documentos/${id}`,
    asignar_folio: (id) => `/app/documentos/${id}`,
    procesar_certificacion: (id) => `/app/documentos/${id}`,
    firmar_certificado: (id) => `/app/documentos/${id}`,
    ver_resultado_final: (id) => `/app/documentos/${id}`,
    enviar_incidencia_tecnica: (id) => uxLinkIncidenciaTecnica(id),
    tomar_incidencia: (id) => uxLinkIncidenciaTecnica(id),
    reintentar_proceso: (id) => uxLinkIncidenciaTecnica(id),
    corregir_observaciones: () => '/app/certificacion/solicitud',
};

const ACCIONES_API = new Set([
    'procesar_certificacion',
    'firmar_certificado',
    'aprobar_expediente',
    'validar_informacion',
    'enviar_validacion',
    'devolver_observaciones',
    'asignar_folio',
    'tomar_incidencia',
    'reintentar_proceso',
]);

const linkStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: '#185FA5',
    textDecoration: 'none',
    marginRight: 8,
    display: 'inline-block',
};

export function InstitutionalBandejaActions({ row, onAccion, busy }) {
    const acciones = bandejaAcciones(row);

    if (!acciones.length) {
        return (
            <Link to={`/app/documentos/${row.id}`} style={linkStyle}>
                Ver detalle
            </Link>
        );
    }

    return (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {acciones.map((a) => {
                if (ACCIONES_API.has(a.accion) && onAccion) {
                    return (
                        <button
                            key={a.accion}
                            type="button"
                            disabled={busy}
                            style={{
                                ...linkStyle,
                                background: 'none',
                                border: 'none',
                                cursor: busy ? 'wait' : 'pointer',
                                padding: '2px 0',
                            }}
                            onClick={() => onAccion(a, row)}
                        >
                            {a.label}
                        </button>
                    );
                }
                const to = ACCION_PATH[a.accion]?.(row.id) ?? `/app/documentos/${row.id}`;
                return (
                    <Link key={a.accion} to={to} style={linkStyle}>
                        {a.label}
                    </Link>
                );
            })}
        </span>
    );
}

export { ejecutarAccionBandeja };
