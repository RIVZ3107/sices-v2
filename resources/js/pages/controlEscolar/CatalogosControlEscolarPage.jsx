import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogosControlEscolarApi } from '../../api/catalogosControlEscolar';
import {
    EsHeaderAction,
    EsPageLayout,
    EsSearchInput,
    EsStatusBadge,
    esTheme,
} from '../../components/educacionSuperior';
import { cceStyles } from '../../components/controlEscolar/catalogos/catalogosControlEscolarStyles';
import { userCanAny } from '../../utils/userPermissions';

const PERM_CREAR_EA = ['control_escolar.catalogos.configurar', 'estatus_academicos.crear', 'catalogos.configurar', 'gestionar_catalogos'];
const PERM_EDITAR_EA = ['control_escolar.catalogos.configurar', 'estatus_academicos.editar', 'catalogos.configurar', 'gestionar_catalogos'];
const PERM_CREAR_EM = ['control_escolar.catalogos.configurar', 'estatus_matricula.crear', 'catalogos.configurar', 'gestionar_catalogos'];
const PERM_EDITAR_EM = ['control_escolar.catalogos.configurar', 'estatus_matricula.editar', 'catalogos.configurar', 'gestionar_catalogos'];
const PERM_CREAR_EC = ['control_escolar.catalogos.configurar', 'escalas_calificacion.crear', 'catalogos.configurar', 'gestionar_catalogos'];
const PERM_EDITAR_EC = ['control_escolar.catalogos.configurar', 'escalas_calificacion.editar', 'catalogos.configurar', 'gestionar_catalogos'];

const TABS = [
    { id: 'academicos', label: 'Estatus académicos' },
    { id: 'matricula', label: 'Estatus de matrícula' },
    { id: 'escalas', label: 'Escalas de calificación' },
];

const CREATE_LABELS = {
    academicos: 'Crear estatus académico',
    matricula: 'Crear estatus de matrícula',
    escalas: 'Crear escala de calificación',
};

const TABLE_HEADERS = ['Clave', 'Nombre', 'Descripción', 'Estatus', 'Acciones'];

function ColorBadge({ color }) {
    if (!color) return null;
    return (
        <span style={cceStyles.colorBadge(color)} title="Color de identificación">
            <span style={cceStyles.badgeDot(color)} aria-hidden="true" />
        </span>
    );
}

function NombreCell({ nombre, color }) {
    return (
        <div style={cceStyles.nombreCell}>
            <span style={cceStyles.nombreText}>{nombre}</span>
            <ColorBadge color={color} />
        </div>
    );
}

function descripcionFila(tab, row) {
    if (tab === 'escalas') {
        const partes = [
            row.tipo_label ?? row.tipo,
            `Rango ${row.calificacion_minima}–${row.calificacion_maxima}`,
            `Aprobatoria ${row.calificacion_aprobatoria}`,
        ];
        if (row.permite_acreditado) partes.push('Permite acreditado');
        if (row.permite_decimales && row.decimales != null) partes.push(`${row.decimales} decimal(es)`);
        return partes.join(' · ');
    }
    if (tab === 'matricula') {
        const partes = [];
        if (row.descripcion?.trim()) partes.push(row.descripcion.trim());
        if (row.bloquea_operacion) partes.push('Bloquea operaciones escolares');
        return partes.length ? partes.join(' · ') : '—';
    }
    return row.descripcion?.trim() || '—';
}

function RowActions({ puedeEditar, row, onEditar, onToggle }) {
    if (!puedeEditar) {
        return <span style={cceStyles.readonlyHint}>Solo lectura</span>;
    }
    return (
        <div style={cceStyles.actionGroup}>
            <button type="button" onClick={() => onEditar(row)} style={cceStyles.actionBtnEdit}>
                Editar
            </button>
            <button type="button" onClick={() => onToggle(row)} style={cceStyles.actionBtnToggle(row.activo)}>
                {row.activo ? 'Desactivar' : 'Activar'}
            </button>
        </div>
    );
}

function FormField({ label, hint, children }) {
    return (
        <label style={cceStyles.formField}>
            <span style={cceStyles.formLabel}>{label}</span>
            {children}
            {hint ? <p style={cceStyles.formHint}>{hint}</p> : null}
        </label>
    );
}

function CatalogoDrawer({ open, title, subtitle, form, onChange, onClose, onSubmit, error, saving, children, submitLabel = 'Guardar' }) {
    if (!open) return null;

    return (
        <>
            <div style={cceStyles.drawerOverlay} onClick={onClose} aria-hidden="true" />
            <aside style={cceStyles.drawer} role="dialog" aria-labelledby="cce-drawer-title">
                <div style={cceStyles.drawerHeader}>
                    <div>
                        <h2 id="cce-drawer-title" style={cceStyles.drawerTitle}>{title}</h2>
                        {subtitle ? <p style={cceStyles.drawerSubtitle}>{subtitle}</p> : null}
                    </div>
                    <button type="button" onClick={onClose} style={esTheme.iconBtn} aria-label="Cerrar">×</button>
                </div>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={cceStyles.drawerBody}>
                        {error ? <p style={cceStyles.formError} role="alert">{error}</p> : null}
                        {children}
                    </div>
                    <div style={cceStyles.drawerFooter}>
                        <button type="button" onClick={onClose} style={esTheme.btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={saving} style={esTheme.btnPrimary}>
                            {saving ? 'Guardando…' : submitLabel}
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}

function EmptyState({ title, description, onCreate, canCreate, createLabel }) {
    return (
        <div style={cceStyles.emptyState}>
            <h3 style={cceStyles.emptyTitle}>{title}</h3>
            <p style={cceStyles.emptyText}>{description}</p>
            {canCreate && onCreate ? (
                <button type="button" onClick={onCreate} style={{ ...esTheme.btnPrimary, marginTop: 20 }}>
                    {createLabel}
                </button>
            ) : null}
        </div>
    );
}

function Toast({ message, type, onDismiss }) {
    if (!message) return null;
    const style = type === 'error' ? cceStyles.toastError : cceStyles.toastSuccess;
    return (
        <div style={{ ...cceStyles.toast, ...style }} role="status">
            <span style={{ flex: 1 }}>{message}</span>
            <button type="button" onClick={onDismiss} style={{ ...esTheme.iconBtn, border: 'none', background: 'transparent' }}>×</button>
        </div>
    );
}

function extractError(err) {
    if (err?.message) return err.message;
    const errors = err?.errors;
    if (errors && typeof errors === 'object') {
        const first = Object.values(errors).flat()[0];
        if (first) return String(first);
    }
    return 'No fue posible completar la operación.';
}

export function CatalogosControlEscolarPage() {
    const [tab, setTab] = useState('academicos');
    const [resumen, setResumen] = useState(null);
    const [items, setItems] = useState([]);
    const [tabResumen, setTabResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('todos');
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [drawer, setDrawer] = useState({ open: false, mode: 'create', record: null });
    const [form, setForm] = useState(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [tiposEscala, setTiposEscala] = useState([]);

    const permisos = useMemo(() => ({
        crearEa: userCanAny(PERM_CREAR_EA),
        editarEa: userCanAny(PERM_EDITAR_EA),
        crearEm: userCanAny(PERM_CREAR_EM),
        editarEm: userCanAny(PERM_EDITAR_EM),
        crearEc: userCanAny(PERM_CREAR_EC),
        editarEc: userCanAny(PERM_EDITAR_EC),
    }), []);

    const puedeCrear = tab === 'academicos' ? permisos.crearEa : tab === 'matricula' ? permisos.crearEm : permisos.crearEc;
    const puedeEditar = tab === 'academicos' ? permisos.editarEa : tab === 'matricula' ? permisos.editarEm : permisos.editarEc;

    const cargarResumen = useCallback(() => {
        catalogosControlEscolarApi.resumen()
            .then((res) => setResumen(res?.data ?? null))
            .catch(() => setResumen(null));
    }, []);

    const cargarTab = useCallback(async () => {
        setLoading(true);
        setError('');
        const params = { per_page: 100 };
        if (busqueda.trim()) params.q = busqueda.trim();
        if (filtroActivo === 'activos') params.activo = true;
        if (filtroActivo === 'inactivos') params.activo = false;

        try {
            let res;
            if (tab === 'academicos') {
                res = await catalogosControlEscolarApi.estatusAcademicos(params);
            } else if (tab === 'matricula') {
                res = await catalogosControlEscolarApi.estatusMatricula(params);
            } else {
                res = await catalogosControlEscolarApi.escalasCalificacion(params);
            }
            setItems(Array.isArray(res?.data) ? res.data : []);
            setTabResumen(res?.resumen ?? null);
        } catch {
            setItems([]);
            setTabResumen(null);
            setError('No fue posible cargar el catálogo seleccionado.');
        } finally {
            setLoading(false);
        }
    }, [tab, busqueda, filtroActivo]);

    useEffect(() => { cargarResumen(); }, [cargarResumen]);

    useEffect(() => {
        catalogosControlEscolarApi.tiposEscala()
            .then((res) => setTiposEscala(Array.isArray(res?.data) ? res.data : []))
            .catch(() => setTiposEscala([]));
    }, []);

    useEffect(() => {
        const t = setTimeout(cargarTab, busqueda ? 300 : 0);
        return () => clearTimeout(t);
    }, [cargarTab, busqueda]);

    const metrics = useMemo(() => {
        const r = resumen ?? {};
        return [
            { title: 'Estatus académicos', value: r.estatus_academicos?.total ?? '—', trend: `${r.estatus_academicos?.activos ?? 0} activos`, trendPrefix: '' },
            { title: 'Estatus de matrícula', value: r.estatus_matricula?.total ?? '—', trend: `${r.estatus_matricula?.activos ?? 0} activos`, trendPrefix: '' },
            { title: 'Escalas de calificación', value: r.escalas_calificacion?.total ?? '—', trend: `${r.escalas_calificacion?.activos ?? 0} activas`, trendPrefix: '' },
        ];
    }, [resumen]);

    const abrirCrear = () => {
        if (tab === 'academicos') {
            setForm({ clave: '', nombre: '', descripcion: '', color: '#185FA5', orden: 0, activo: true });
        } else if (tab === 'matricula') {
            setForm({ clave: '', nombre: '', descripcion: '', color: '#185FA5', bloquea_operacion: false, orden: 0, activo: true });
        } else {
            setForm({
                clave: '', nombre: '', tipo: 'numerica_0_10',
                calificacion_minima: 0, calificacion_maxima: 10, calificacion_aprobatoria: 6,
                permite_decimales: true, decimales: 1, permite_acreditado: false, activo: true,
            });
        }
        setFormError('');
        setDrawer({ open: true, mode: 'create', record: null });
    };

    const abrirEditar = (record) => {
        setForm({ ...record });
        setFormError('');
        setDrawer({ open: true, mode: 'edit', record });
    };

    const cerrarDrawer = () => {
        setDrawer({ open: false, mode: 'create', record: null });
        setForm(null);
        setFormError('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (tab === 'academicos') {
                if (drawer.mode === 'create') {
                    await catalogosControlEscolarApi.crearEstatusAcademico(form);
                } else {
                    await catalogosControlEscolarApi.actualizarEstatusAcademico(drawer.record.id, form);
                }
            } else if (tab === 'matricula') {
                if (drawer.mode === 'create') {
                    await catalogosControlEscolarApi.crearEstatusMatricula(form);
                } else {
                    await catalogosControlEscolarApi.actualizarEstatusMatricula(drawer.record.id, form);
                }
            } else if (drawer.mode === 'create') {
                await catalogosControlEscolarApi.crearEscalaCalificacion(form);
            } else {
                await catalogosControlEscolarApi.actualizarEscalaCalificacion(drawer.record.id, form);
            }
            cerrarDrawer();
            setToast({ message: drawer.mode === 'create' ? 'Registro creado correctamente.' : 'Cambios guardados.', type: 'success' });
            cargarTab();
            cargarResumen();
        } catch (err) {
            setFormError(extractError(err));
        } finally {
            setSaving(false);
        }
    };

    const toggleActivo = async (record) => {
        if (!puedeEditar) return;
        const activo = !record.activo;
        try {
            if (tab === 'academicos') {
                await catalogosControlEscolarApi.activarEstatusAcademico(record.id, activo);
            } else if (tab === 'matricula') {
                await catalogosControlEscolarApi.activarEstatusMatricula(record.id, activo);
            } else {
                await catalogosControlEscolarApi.activarEscalaCalificacion(record.id, activo);
            }
            setToast({ message: activo ? 'Registro activado.' : 'Registro desactivado.', type: 'success' });
            cargarTab();
            cargarResumen();
        } catch (err) {
            setToast({ message: extractError(err), type: 'error' });
        }
    };

    const emptyCopy = {
        academicos: {
            title: 'Sin estatus académicos',
            description: 'Configure los estatus que describen la situación académica de los alumnos en la institución.',
        },
        matricula: {
            title: 'Sin estatus de matrícula',
            description: 'Defina los estatus que aplican durante el ciclo de vida de una matrícula escolar.',
        },
        escalas: {
            title: 'Sin escalas de calificación',
            description: 'Registre las escalas que utilizará la institución para captura y evaluación de calificaciones.',
        },
    };

    const drawerTitle = drawer.mode === 'create'
        ? (tab === 'academicos' ? 'Nuevo estatus académico' : tab === 'matricula' ? 'Nuevo estatus de matrícula' : 'Nueva escala de calificación')
        : (tab === 'academicos' ? 'Editar estatus académico' : tab === 'matricula' ? 'Editar estatus de matrícula' : 'Editar escala de calificación');

    return (
        <EsPageLayout
            breadcrumbCurrent="Control escolar"
            title="Configuración académica"
            subtitle="Estatus académicos, matrícula y escalas de calificación para la operación escolar."
            metrics={metrics}
            metricsWide
            loading={loading && !items.length && !error}
            error={error && !items.length ? error : ''}
            showSplit={false}
            actions={puedeCrear ? (
                <EsHeaderAction icon="plus" label={CREATE_LABELS[tab]} variant="primary" onClick={abrirCrear} />
            ) : null}
        >
            <div style={cceStyles.tabs} role="tablist">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        style={{ ...cceStyles.tab, ...(tab === t.id ? cceStyles.tabActive : {}) }}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={cceStyles.card}>
                <div style={cceStyles.toolbar}>
                    <div style={cceStyles.toolbarFilters}>
                        <EsSearchInput
                            value={busqueda}
                            onChange={setBusqueda}
                            placeholder="Buscar por clave o nombre…"
                            width={260}
                        />
                        <select
                            value={filtroActivo}
                            onChange={(e) => setFiltroActivo(e.target.value)}
                            style={{ ...esTheme.inputSearch, minWidth: 140 }}
                            aria-label="Filtrar por estatus"
                        >
                            <option value="todos">Todos</option>
                            <option value="activos">Activos</option>
                            <option value="inactivos">Inactivos</option>
                        </select>
                    </div>
                    {tabResumen ? (
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                            {tabResumen.total ?? 0} registros · {tabResumen.activos ?? 0} activos
                        </span>
                    ) : null}
                </div>

                {!loading && items.length === 0 ? (
                    <EmptyState
                        title={emptyCopy[tab].title}
                        description={emptyCopy[tab].description}
                        onCreate={abrirCrear}
                        canCreate={puedeCrear}
                        createLabel={CREATE_LABELS[tab]}
                    />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    {TABLE_HEADERS.map((header) => (
                                        <th key={header} style={header === 'Acciones' ? { width: 180 } : undefined}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <code style={cceStyles.claveCode}>{row.clave}</code>
                                        </td>
                                        <td>
                                            {tab === 'escalas' ? (
                                                <span style={cceStyles.nombreText}>{row.nombre}</span>
                                            ) : (
                                                <NombreCell nombre={row.nombre} color={row.color} />
                                            )}
                                        </td>
                                        <td style={cceStyles.descripcionCell}>{descripcionFila(tab, row)}</td>
                                        <td>
                                            <EsStatusBadge status={row.activo ? 'activo' : 'inactivo'}>
                                                {row.activo ? 'Activo' : 'Inactivo'}
                                            </EsStatusBadge>
                                        </td>
                                        <td>
                                            <RowActions
                                                puedeEditar={puedeEditar}
                                                row={row}
                                                onEditar={abrirEditar}
                                                onToggle={toggleActivo}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CatalogoDrawer
                open={drawer.open}
                title={drawerTitle}
                subtitle="Complete los campos requeridos para la operación escolar."
                form={form}
                onChange={setForm}
                onClose={cerrarDrawer}
                onSubmit={guardar}
                error={formError}
                saving={saving}
                submitLabel={drawer.mode === 'create' ? 'Crear' : 'Guardar cambios'}
            >
                {form && tab !== 'escalas' ? (
                    <>
                        <FormField label="Clave" hint="Identificador interno, sin espacios">
                            <input
                                required
                                value={form.clave}
                                onChange={(e) => setForm({ ...form, clave: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Nombre">
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Descripción">
                            <textarea
                                value={form.descripcion ?? ''}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%', minHeight: 72, resize: 'vertical' }}
                            />
                        </FormField>
                        <FormField label="Color" hint="Color para identificación visual">
                            <input
                                type="color"
                                value={form.color || '#185FA5'}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                                style={{ width: 48, height: 36, padding: 2, border: '1px solid #E2E8F0', borderRadius: 8 }}
                            />
                        </FormField>
                        <FormField label="Orden">
                            <input
                                type="number"
                                min={0}
                                value={form.orden ?? 0}
                                onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        {tab === 'matricula' ? (
                            <label style={cceStyles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.bloquea_operacion)}
                                    onChange={(e) => setForm({ ...form, bloquea_operacion: e.target.checked })}
                                />
                                Bloquea operaciones escolares
                            </label>
                        ) : null}
                        <label style={cceStyles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={form.activo !== false}
                                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                            />
                            Registro activo
                        </label>
                    </>
                ) : null}
                {form && tab === 'escalas' ? (
                    <>
                        <FormField label="Clave">
                            <input
                                required
                                value={form.clave}
                                onChange={(e) => setForm({ ...form, clave: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Nombre">
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Tipo de escala">
                            <select
                                required
                                value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            >
                                {tiposEscala.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Calificación mínima">
                            <input
                                type="number"
                                step="0.01"
                                value={form.calificacion_minima}
                                onChange={(e) => setForm({ ...form, calificacion_minima: Number(e.target.value) })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Calificación máxima">
                            <input
                                type="number"
                                step="0.01"
                                value={form.calificacion_maxima}
                                onChange={(e) => setForm({ ...form, calificacion_maxima: Number(e.target.value) })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Calificación aprobatoria">
                            <input
                                type="number"
                                step="0.01"
                                value={form.calificacion_aprobatoria}
                                onChange={(e) => setForm({ ...form, calificacion_aprobatoria: Number(e.target.value) })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <label style={cceStyles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={Boolean(form.permite_decimales)}
                                onChange={(e) => setForm({ ...form, permite_decimales: e.target.checked })}
                            />
                            Permite decimales
                        </label>
                        <FormField label="Decimales">
                            <input
                                type="number"
                                min={0}
                                max={4}
                                value={form.decimales ?? 0}
                                onChange={(e) => setForm({ ...form, decimales: Number(e.target.value) })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <label style={cceStyles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={Boolean(form.permite_acreditado)}
                                onChange={(e) => setForm({ ...form, permite_acreditado: e.target.checked })}
                            />
                            Permite acreditado / no acreditado
                        </label>
                        <label style={cceStyles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={form.activo !== false}
                                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                            />
                            Escala activa
                        </label>
                    </>
                ) : null}
            </CatalogoDrawer>

            <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'success' })} />
        </EsPageLayout>
    );
}

export default CatalogosControlEscolarPage;
