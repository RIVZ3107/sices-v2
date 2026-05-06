import { useEffect, useMemo, useState } from 'react';
import { usuariosRolesApi } from '../../api/usuariosRoles';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DataTableWrapper } from '../../components/ui/DataTableWrapper';
import { ModuleHeader } from '../../components/ui/ModuleHeader';
import { RoleBadge } from '../../components/ui/RoleBadge';

export function UsuariosRolesPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [search, setSearch] = useState('');
    const [rolFiltro, setRolFiltro] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', roles: [] });

    const metricas = useMemo(() => {
        const conteoRoles = usuarios.reduce((acc, item) => acc + (item.roles?.length ?? 0), 0);
        return {
            usuariosActivos: usuarios.length,
            rolesConfigurados: roles.length,
            asignaciones: conteoRoles,
        };
    }, [roles.length, usuarios]);

    async function cargarData() {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const [resUsuarios, resRoles] = await Promise.all([
                usuariosRolesApi.listUsuarios({ search, rol: rolFiltro || undefined, per_page: 100 }),
                usuariosRolesApi.listRoles(),
            ]);
            setUsuarios(resUsuarios?.data ?? []);
            setRoles(resRoles?.data ?? []);
        } catch (err) {
            setError(err?.message ?? 'No fue posible cargar usuarios y roles.');
            setUsuarios([]);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const usuariosFiltrados = useMemo(() => {
        if (!rolFiltro) {
            return usuarios;
        }
        return usuarios.filter((item) => (item.roles ?? []).includes(rolFiltro));
    }, [rolFiltro, usuarios]);

    function abrirEditor(usuario) {
        setError('');
        setSuccess('');
        setEditando(usuario);
        setForm({
            name: usuario.name ?? '',
            email: usuario.email ?? '',
            password: '',
            roles: usuario.roles ?? [],
        });
    }

    function cerrarEditor() {
        setEditando(null);
        setForm({ name: '', email: '', password: '', roles: [] });
    }

    function toggleRol(rolName) {
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(rolName)
                ? prev.roles.filter((r) => r !== rolName)
                : [...prev.roles, rolName],
        }));
    }

    async function guardarEdicion() {
        if (!editando) return;
        if (!form.name.trim() || !form.email.trim() || form.roles.length === 0) {
            setError('Nombre, correo y al menos un rol son obligatorios.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                roles: form.roles,
            };
            if (form.password.trim()) {
                payload.password = form.password.trim();
            }
            await usuariosRolesApi.updateUsuario(editando.id, payload);
            setSuccess('Usuario actualizado correctamente.');
            cerrarEditor();
            await cargarData();
        } catch (err) {
            setError(err?.message ?? 'No fue posible actualizar el usuario.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <DashboardShell>
            <ModuleHeader
                title="Usuarios y roles"
                subtitle="Administración institucional de accesos, roles y permisos operativos."
                actions={<button className="inst-btn inst-btn-primary text-sm" onClick={cargarData}>Actualizar</button>}
            />
            {error ? <DashboardInstitutionalNotice type="danger" message={error} /> : null}
            {success ? <DashboardInstitutionalNotice type="success" message={success} /> : null}
            {!error ? <DashboardInstitutionalNotice type="info" message="Gestión conectada a backend para listado de usuarios y catálogo de roles." /> : null}
            <div className="inst-dashboard-grid-metrics">
                <DashboardMetricCard title="Usuarios activos" value={metricas.usuariosActivos} subtitle="Usuarios con acceso al sistema" />
                <DashboardMetricCard title="Roles configurados" value={metricas.rolesConfigurados} subtitle="Roles disponibles en Spatie" />
                <DashboardMetricCard title="Roles asignados" value={metricas.asignaciones} subtitle="Asignaciones actuales por usuario" />
                <DashboardMetricCard title="Estado" value={loading ? 'Cargando' : 'Operativo'} subtitle={loading ? 'Sincronizando datos' : 'Sincronización estable'} />
            </div>
            <DataTableWrapper
                title="Gestión de usuarios"
                toolbar={(
                    <div className="flex gap-2">
                        <input
                            className="inst-input w-44 text-sm"
                            placeholder="Buscar usuario..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="inst-select w-48 text-sm"
                            value={rolFiltro}
                            onChange={(e) => setRolFiltro(e.target.value)}
                        >
                            <option value="">Todos los roles</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.name}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                        <button className="inst-btn inst-btn-primary text-sm" type="button" onClick={cargarData}>
                            Buscar
                        </button>
                    </div>
                )}
            >
                <table className="inst-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length === 0 ? (
                            <tr>
                                <td className="text-sm font-semibold" colSpan={5}>
                                    {loading ? 'Cargando usuarios...' : 'Sin resultados para el filtro actual.'}
                                </td>
                            </tr>
                        ) : (
                            usuariosFiltrados.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td className="text-sm font-semibold">{usuario.name}</td>
                                    <td className="text-sm inst-muted">{usuario.email}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1">
                                            {(usuario.roles ?? []).map((role) => (
                                                <RoleBadge key={`${usuario.id}-${role}`} role={role} />
                                            ))}
                                        </div>
                                    </td>
                                    <td><span className="inst-badge inst-badge-success">{usuario.status ?? 'activo'}</span></td>
                                    <td>
                                        <button
                                            type="button"
                                            className="inst-btn inst-btn-primary text-xs"
                                            onClick={() => abrirEditor(usuario)}
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </DataTableWrapper>

            {editando ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-3">
                    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Editar usuario</h3>
                                <p className="text-xs text-slate-500">Actualiza datos base y roles asignados.</p>
                            </div>
                            <button type="button" className="inst-btn text-xs" onClick={cerrarEditor}>
                                Cerrar
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                                <input
                                    className="inst-input w-full text-sm"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Correo</label>
                                <input
                                    className="inst-input w-full text-sm"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                                Contraseña (opcional)
                            </label>
                            <input
                                type="password"
                                className="inst-input w-full text-sm"
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="Solo llena si deseas cambiarla"
                            />
                        </div>

                        <div className="mt-3">
                            <p className="mb-1 text-xs font-semibold text-slate-600">Roles</p>
                            <div className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
                                {roles.map((role) => (
                                    <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.roles.includes(role.name)}
                                            onChange={() => toggleRol(role.name)}
                                        />
                                        <span>{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" className="inst-btn text-sm" onClick={cerrarEditor}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="inst-btn inst-btn-primary text-sm"
                                onClick={guardarEdicion}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </DashboardShell>
    );
}
