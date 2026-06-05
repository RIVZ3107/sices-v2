import { EsStatusBadge } from '../../educacionSuperior/EsStatusBadge';
import { esColors, esTheme, formatEsNum } from '../../educacionSuperior/esTheme';
import { formatFechaRango } from './ciclosShared';
import { cpStyles } from './ciclosPeriodosStyles';

export function CiclosList({
    ciclos = [],
    selectedId = null,
    loading = false,
    meta = {},
    page = 1,
    onSelect,
    onPageChange,
    puedeEditar = false,
    onEdit,
    emptyMessage = 'No se encontraron ciclos con los filtros seleccionados.',
}) {
    const total = meta.total ?? ciclos.length;
    const lastPage = meta.last_page ?? 1;

    return (
        <div style={cpStyles.listCard}>
            <div style={cpStyles.listHeader}>
                <div>
                    <h3 style={cpStyles.listHeaderTitle}>Ciclos escolares</h3>
                    <p style={cpStyles.listHeaderMeta}>{formatEsNum(total)} registrados</p>
                </div>
            </div>

            {loading ? (
                <p style={{ padding: 24, margin: 0, fontSize: 13, color: esColors.muted, textAlign: 'center' }}>
                    Cargando ciclos…
                </p>
            ) : ciclos.length === 0 ? (
                <p style={{ padding: 24, margin: 0, fontSize: 13, color: esColors.muted, textAlign: 'center' }}>
                    {emptyMessage}
                </p>
            ) : (
                <div>
                    {ciclos.map((c) => {
                        const selected = c.id === selectedId;
                        return (
                            <div
                                key={c.id}
                                role="button"
                                tabIndex={0}
                                style={{
                                    ...cpStyles.cicloRow,
                                    ...(selected ? cpStyles.cicloRowSelected : {}),
                                }}
                                onClick={() => onSelect?.(c)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelect?.(c);
                                    }
                                }}
                            >
                                <div>
                                    <span style={cpStyles.cicloRowClave}>{c.clave}</span>
                                    {c.es_actual ? (
                                        <span style={{ marginLeft: 8 }}>
                                            <EsStatusBadge color="green">Actual</EsStatusBadge>
                                        </span>
                                    ) : null}
                                </div>
                                <div>
                                    <p style={cpStyles.cicloRowNombre}>{c.nombre}</p>
                                    <p style={cpStyles.cicloRowFechas}>
                                        {formatFechaRango(c.fecha_inicio, c.fecha_fin)}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                    <EsStatusBadge status={c.estatus}>{c.activo ? 'Activo' : 'Inactivo'}</EsStatusBadge>
                                    {puedeEditar ? (
                                        <button
                                            type="button"
                                            style={{ ...esTheme.btnSecondary, height: 30, fontSize: 11, padding: '0 10px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit?.(c);
                                            }}
                                        >
                                            Editar
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {lastPage > 1 ? (
                <div style={cpStyles.pagination}>
                    <span>Página {page} de {lastPage}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            type="button"
                            style={esTheme.btnSecondary}
                            disabled={page <= 1}
                            onClick={() => onPageChange?.(page - 1)}
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            style={esTheme.btnSecondary}
                            disabled={page >= lastPage}
                            onClick={() => onPageChange?.(page + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
