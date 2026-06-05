import { EsTable, esColors, esTheme } from '../educacionSuperior';
import { formatEsNum } from '../educacionSuperior/esTheme';
import { InformacionTecnicaPanel, renderCatalogoCell } from './catalogoUtils';

export function CatalogoDataTable({
    columns,
    rows = [],
    modoTecnico = false,
    loading = false,
    emptyMessage = 'No hay registros disponibles.',
    meta = null,
    page = 1,
    onPageChange,
    onRowClick,
    selectedId = null,
}) {
    const cols = Array.isArray(columns) ? columns : [];
    const headers = cols.map((c) => c.label);
    if (modoTecnico) {
        headers.push('Información técnica');
    }

    return (
        <>
            <EsTable
                headers={headers}
                emptyColSpan={headers.length}
                emptyMessage={!loading && rows.length === 0 ? emptyMessage : null}
            >
                {rows.map((row) => (
                    <tr
                        key={row.id ?? `${row.clave}-${row.nombre}`}
                        style={{
                            ...esTheme.tr,
                            cursor: onRowClick ? 'pointer' : undefined,
                            background: selectedId === row.id ? '#EFF6FF' : undefined,
                        }}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                        {cols.map((col) => (
                            <td key={col.key} style={esTheme.td}>
                                {renderCatalogoCell(row, col)}
                            </td>
                        ))}
                        {modoTecnico ? (
                            <td style={{ ...esTheme.td, minWidth: 160 }}>
                                {row.informacion_tecnica ? (
                                    <InformacionTecnicaPanel row={row} />
                                ) : '—'}
                            </td>
                        ) : null}
                    </tr>
                ))}
            </EsTable>

            {meta && meta.last_page > 1 ? (
                <div style={{ padding: 16, borderTop: `1px solid ${esColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => onPageChange?.(Math.max(1, page - 1))}
                        style={esTheme.btnSecondary}
                    >
                        Anterior
                    </button>
                    <span style={{ fontSize: 12, color: esColors.muted }}>
                        Página {meta.current_page} de {meta.last_page} · {formatEsNum(meta.total ?? 0)} registros
                    </span>
                    <button
                        type="button"
                        disabled={page >= meta.last_page || loading}
                        onClick={() => onPageChange?.(page + 1)}
                        style={esTheme.btnSecondary}
                    >
                        Siguiente
                    </button>
                </div>
            ) : null}
        </>
    );
}
