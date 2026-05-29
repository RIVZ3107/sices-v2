import { Link } from 'react-router-dom';
import { EsTable, esColors, esTheme } from '../educacionSuperior';
import { CertificationStatusBadge } from './CertificationStatusBadge';
import { esCan } from '../../utils/esCertificacionPermissions';
import { documentoProcesoTecnicoDetallePath } from '../../utils/certificacionRoutes';
import { revisionInstitucionalDetallePath } from '../../utils/certificacionRoutes';

const HEADERS = [
    'Alumno',
    'CURP',
    'Matrícula',
    'Institución / CCT',
    'Programa',
    'Tipo',
    'Prom.',
    'Folio',
    'Expedición',
    'Estado académico',
    'Procesamiento',
    'Firma',
    'Acciones',
];

function ActionLink({ to, children, onClick, title }) {
    if (onClick) {
        return (
            <button
                type="button"
                title={title}
                onClick={onClick}
                style={{
                    background: 'none',
                    border: 'none',
                    color: esColors.primary,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '2px 6px',
                }}
            >
                {children}
            </button>
        );
    }
    return (
        <Link to={to} title={title} style={{ fontSize: 12, fontWeight: 500, color: esColors.primary, marginRight: 6 }}>
            {children}
        </Link>
    );
}

function fmtFecha(v) {
    if (!v) return '—';
    try {
        return new Date(v).toLocaleDateString('es-MX');
    } catch {
        return '—';
    }
}

export function CertificationWorkflowTable({
    rows,
    onAsignarFolio,
    onProcesar,
    onFirmar,
    onAprobar,
    onObservar,
    onVerError,
    onEnviarSistemas,
}) {
    return (
        <EsTable headers={HEADERS} emptyColSpan={HEADERS.length} emptyMessage={null}>
            {rows.map((item) => (
                <tr key={item.id} style={esTheme.tr}>
                    <td style={{ ...esTheme.td, fontWeight: 500 }}>{item.alumno}</td>
                    <td style={{ ...esTheme.td, fontFamily: 'monospace', fontSize: 12 }}>{item.curp || '—'}</td>
                    <td style={esTheme.td}>{item.matricula || '—'}</td>
                    <td style={{ ...esTheme.td, color: esColors.muted, maxWidth: 160 }}>{item.institucion}</td>
                    <td style={esTheme.td}>{item.programa}</td>
                    <td style={esTheme.td}>
                        {item.tipoDocumento}
                        {item.tipoCertificacion ? (
                            <span style={{ display: 'block', fontSize: 11, color: esColors.muted }}>{item.tipoCertificacion}</span>
                        ) : null}
                    </td>
                    <td style={esTheme.td}>{item.promedio}</td>
                    <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{item.folio}</td>
                    <td style={esTheme.td}>{fmtFecha(item.fechaExpedicion)}</td>
                    <td style={esTheme.td}>
                        <CertificationStatusBadge badge={item.estadoCertificador?.badge}>
                            {item.estadoCertificador?.label}
                        </CertificationStatusBadge>
                    </td>
                    <td style={esTheme.td}>
                        <CertificationStatusBadge badge={item.estadoProcesamiento?.badge}>
                            {item.estadoProcesamiento?.label}
                        </CertificationStatusBadge>
                    </td>
                    <td style={esTheme.td}>
                        <CertificationStatusBadge badge={item.estadoFirma?.badge}>
                            {item.estadoFirma?.label}
                        </CertificationStatusBadge>
                    </td>
                    <td style={{ ...esTheme.td, whiteSpace: 'nowrap', maxWidth: 220 }}>
                        {esCan('expediente') && item.alumnoId ? (
                            <ActionLink to={`/app/alumnos/${item.alumnoId}/expediente`} title="Ver expediente">
                                Expediente
                            </ActionLink>
                        ) : null}
                        {esCan('validar') && item.puedeValidar ? (
                            <ActionLink to={revisionInstitucionalDetallePath(item.id)} title="Validar">
                                Validar
                            </ActionLink>
                        ) : null}
                        {esCan('validar') && item.puedeAprobar ? (
                            <ActionLink title="Aprobar" onClick={() => onAprobar?.(item)}>
                                Aprobar
                            </ActionLink>
                        ) : null}
                        {esCan('observar') ? (
                            <ActionLink title="Observar" onClick={() => onObservar?.(item)}>
                                Observar
                            </ActionLink>
                        ) : null}
                        {esCan('folio') && item.puedeAsignarFolio ? (
                            <ActionLink title="Asignar folio" onClick={() => onAsignarFolio?.(item)}>
                                Folio
                            </ActionLink>
                        ) : null}
                        {esCan('procesar') && item.puedeProcesar ? (
                            <ActionLink title="Procesar certificación" onClick={() => onProcesar?.(item)}>
                                Procesar
                            </ActionLink>
                        ) : null}
                        {esCan('firmar') && item.puedeFirmar ? (
                            <ActionLink title="Firmar certificado" onClick={() => onFirmar?.(item)}>
                                Firmar
                            </ActionLink>
                        ) : null}
                        {esCan('obtenerResultadoFinal') && item.estadoFirma?.label === 'Firmado' ? (
                            <ActionLink to={`/app/documentos/${item.id}`} title="Ver PDF final">
                                PDF
                            </ActionLink>
                        ) : null}
                        {item.tieneIncidencia ? (
                            <>
                                {esCan('enviarIncidenciaSistemas') ? (
                                    <ActionLink title="Ver error técnico" onClick={() => onVerError?.(item)}>
                                        Error
                                    </ActionLink>
                                ) : null}
                                {esCan('enviarIncidenciaSistemas') ? (
                                    <ActionLink title="Incidencia técnica" onClick={() => onEnviarSistemas?.(item)}>
                                        Sistemas
                                    </ActionLink>
                                ) : null}
                            </>
                        ) : null}
                    </td>
                </tr>
            ))}
        </EsTable>
    );
}
