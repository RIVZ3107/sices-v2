export function DataTable({ columns = [], rows = [], emptyText = 'Sin datos disponibles.' }) {
    return (
        <div className="overflow-x-auto inst-surface">
            <table className="inst-table min-w-full text-sm">
                <thead className="text-left">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-3 py-2">{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-slate-500">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, idx) => (
                            <tr key={row.id ?? idx} className="border-t border-slate-100">
                                {columns.map((col) => (
                                    <td key={col.key} className="px-3 py-2">
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
