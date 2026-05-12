import { useCallback, useEffect, useState } from 'react';
import { fetchAdminMenus, updateAdminMenu } from '../../api/menus';

function MenuRow({ row, onSaved }) {
    const [label, setLabel] = useState(row.label);
    const [route, setRoute] = useState(row.route);
    const [icon, setIcon] = useState(row.icon);
    const [active, setActive] = useState(Boolean(row.is_active));
    const [saving, setSaving] = useState(false);

    const save = useCallback(async () => {
        setSaving(true);
        try {
            await updateAdminMenu(row.id, {
                label,
                route,
                icon,
                is_active: active,
            });
            onSaved();
        } finally {
            setSaving(false);
        }
    }, [active, icon, label, onSaved, row.id, route]);

    return (
        <tr>
            <td className="px-3 py-2 text-sm">{row.id}</td>
            <td className="px-3 py-2 text-sm">{row.parent_id ?? '—'}</td>
            <td className="px-3 py-2">
                <input className="admin-input w-full text-sm" value={label} onChange={(e) => setLabel(e.target.value)} />
            </td>
            <td className="px-3 py-2">
                <input className="admin-input w-full text-sm" value={route} onChange={(e) => setRoute(e.target.value)} />
            </td>
            <td className="px-3 py-2">
                <input className="admin-input w-24 text-sm" value={icon} onChange={(e) => setIcon(e.target.value)} />
            </td>
            <td className="px-3 py-2 text-sm">{row.permission_name ?? '—'}</td>
            <td className="px-3 py-2 text-xs">{row.roles?.map((r) => r.name).join(', ') || '—'}</td>
            <td className="px-3 py-2">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                    Activo
                </label>
            </td>
            <td className="px-3 py-2">
                <button type="button" className="admin-btn admin-btn-secondary text-sm" disabled={saving} onClick={save}>
                    {saving ? 'Guardando…' : 'Guardar'}
                </button>
            </td>
        </tr>
    );
}

export function MenusPorRolPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchAdminMenus();
            setRows(res.data ?? []);
        } catch (e) {
            setError(e?.message ?? 'No se pudieron cargar los menús.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="admin-page">
            <div className="admin-page-head">
                <div>
                    <h1 className="admin-page-title">Menús por rol</h1>
                    <p className="admin-page-subtitle text-slate-600">
                        Configuración dinámica de navegación (etiqueta, ruta, icono, roles y permiso). Los usuarios reciben
                        menús filtrados desde el backend en <code className="text-xs">GET /api/v1/me/menus</code>.
                    </p>
                </div>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={load} disabled={loading}>
                    Recargar
                </button>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {loading ? (
                <p className="text-sm text-slate-600">Cargando…</p>
            ) : (
                <div className="admin-card overflow-x-auto">
                    <table className="min-w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Padre</th>
                                <th className="px-3 py-2">Etiqueta</th>
                                <th className="px-3 py-2">Ruta</th>
                                <th className="px-3 py-2">Icono</th>
                                <th className="px-3 py-2">Permiso</th>
                                <th className="px-3 py-2">Roles</th>
                                <th className="px-3 py-2">Estado</th>
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <MenuRow key={row.id} row={row} onSaved={load} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
