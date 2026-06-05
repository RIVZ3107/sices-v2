import { EsStatusBadge } from '../../educacionSuperior/EsStatusBadge';
import { esColors, esTheme, formatEsNum } from '../../educacionSuperior/esTheme';
import { formatFechaRango } from './ciclosShared';
import { cpStyles } from './ciclosPeriodosStyles';
import { PeriodosTimeline } from './PeriodosTimeline';

export function CicloDetailPanel({
    ciclo,
    periodos = [],
    loadingPeriodos = false,
    puedeEditar = false,
    onEditar,
    onMarcarActual,
    onToggleActivo,
    onAgregarPeriodo,
    onEditarPeriodo,
    onTogglePeriodo,
}) {
    if (!ciclo) {
        return (
            <div style={cpStyles.placeholderDetail}>
                Seleccione un ciclo escolar para ver su detalle y periodos asociados.
            </div>
        );
    }

    return (
        <div style={cpStyles.detailPanel}>
            <div style={cpStyles.detailHeader}>
                <h3 style={cpStyles.detailTitle}>{ciclo.nombre}</h3>
                <p style={cpStyles.detailClave}>{ciclo.clave}</p>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ciclo.es_actual ? (
                        <EsStatusBadge color="green">Ciclo actual</EsStatusBadge>
                    ) : null}
                    <EsStatusBadge status={ciclo.estatus}>{ciclo.activo ? 'Activo' : 'Inactivo'}</EsStatusBadge>
                </div>
            </div>
            <div style={cpStyles.detailBody}>
                <div style={cpStyles.detailMetaGrid}>
                    <div style={cpStyles.metaItem}>
                        <p style={cpStyles.metaLabel}>Vigencia</p>
                        <p style={cpStyles.metaValue}>{formatFechaRango(ciclo.fecha_inicio, ciclo.fecha_fin)}</p>
                    </div>
                    <div style={cpStyles.metaItem}>
                        <p style={cpStyles.metaLabel}>Periodos</p>
                        <p style={cpStyles.metaValue}>{formatEsNum(ciclo.periodos_count ?? periodos.length)}</p>
                    </div>
                </div>

                {puedeEditar ? (
                    <div style={cpStyles.detailActions}>
                        <button type="button" style={esTheme.btnSecondary} onClick={onEditar}>
                            Editar ciclo
                        </button>
                        {!ciclo.es_actual && ciclo.activo ? (
                            <button type="button" style={esTheme.btnSecondary} onClick={onMarcarActual}>
                                Marcar como actual
                            </button>
                        ) : null}
                        <button type="button" style={esTheme.btnSecondary} onClick={onToggleActivo}>
                            {ciclo.activo ? 'Desactivar ciclo' : 'Activar ciclo'}
                        </button>
                        <button type="button" style={esTheme.btnPrimary} onClick={onAgregarPeriodo}>
                            Agregar periodo
                        </button>
                    </div>
                ) : null}

                <h4 style={cpStyles.sectionTitle}>Periodos académicos</h4>
                <PeriodosTimeline
                    periodos={periodos}
                    loading={loadingPeriodos}
                    puedeEditar={puedeEditar}
                    onEdit={onEditarPeriodo}
                    onToggleActivo={onTogglePeriodo}
                />
            </div>
        </div>
    );
}
