import { Link } from 'react-router-dom';
import { EsTable, esColors, esTheme } from '../educacionSuperior';
import { CertificationPriorityBadge } from './CertificationPriorityBadge';
import { CertificationStatusBadge } from './CertificationStatusBadge';
import { esCan } from '../../utils/esCertificacionPermissions';
import { revisionInstitucionalDetallePath } from '../../utils/certificacionRoutes';

const HEADERS = [
    'Folio',
    'Alumno',
    'Institución',
    'Programa',
    'Tipo',
    'Fase',
    'Días',
    'Prioridad',
    'Estatus',
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

export function CertificationWorkflowTable({
    rows,
    onAsignarFolio,
    onLiberarProceso,
    onObservar,
}) {
    return (
        <EsTable headers={HEADERS} emptyColSpan={HEADERS.length} emptyMessage={null}>
            {rows.map((item) => (
                <tr key={item.id} style={esTheme.tr}>
                    <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{item.folio}</td>
                    <td style={{ ...esTheme.td, fontWeight: 500 }}>{item.alumno}</td>
                    <td style={{ ...esTheme.td, color: esColors.muted }}>{item.institucion}</td>
                    <td style={{ ...esTheme.td, color: esColors.muted }}>{item.programa}</td>
                    <td style={esTheme.td}>{item.tipoDocumento}</td>
                    <td style={esTheme.td}>
                        <CertificationStatusBadge badge={item.fase.badge}>{item.fase.label}</CertificationStatusBadge>
                    </td>
                    <td style={{ ...esTheme.td, textAlign: 'center' }}>{item.diasEspera}</td>
                    <td style={esTheme.td}>
                        <CertificationPriorityBadge badge={item.prioridad.badge} label={item.prioridad.label} />
                    </td>
                    <td style={esTheme.td}>
                        <CertificationStatusBadge badge={item.estatus.badge}>{item.estatus.label}</CertificationStatusBadge>
                    </td>
                    <td style={{ ...esTheme.td, whiteSpace: 'nowrap' }}>
                        {esCan('expediente') && item.alumnoId ? (
                            <ActionLink to={`/app/alumnos/${item.alumnoId}/expediente`} title="Ver expediente">
                                Expediente
                            </ActionLink>
                        ) : null}
                        {esCan('validar') ? (
                            <ActionLink to={revisionInstitucionalDetallePath(item.id)} title="Validar">
                                Validar
                            </ActionLink>
                        ) : null}
                        {esCan('observar') ? (
                            <ActionLink
                                to={onObservar ? undefined : revisionInstitucionalDetallePath(item.id)}
                                title="Observar"
                                onClick={onObservar ? () => onObservar(item) : undefined}
                            >
                                Observar
                            </ActionLink>
                        ) : null}
                        {esCan('folio') && item.puedeAsignarFolio ? (
                            <ActionLink title="Asignar folio" onClick={() => onAsignarFolio?.(item)}>
                                Folio
                            </ActionLink>
                        ) : null}
                        {esCan('liberar') && item.puedeLiberar ? (
                            <ActionLink title="Liberar a proceso técnico" onClick={() => onLiberarProceso?.(item)}>
                                Liberar
                            </ActionLink>
                        ) : null}
                        {esCan('ver') ? (
                            <ActionLink to={`/app/documentos/${item.id}`} title="Historial / detalle">
                                Historial
                            </ActionLink>
                        ) : null}
                    </td>
                </tr>
            ))}
        </EsTable>
    );
}
