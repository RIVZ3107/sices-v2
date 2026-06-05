import { esTheme } from '../../educacionSuperior/esTheme';
import { cpStyles } from './ciclosPeriodosStyles';

function FormField({ label, hint, children }) {
    return (
        <label style={cpStyles.formField}>
            <span style={cpStyles.formLabel}>{label}</span>
            {children}
            {hint ? <p style={cpStyles.formHint}>{hint}</p> : null}
        </label>
    );
}

export function CicloFormDrawer({
    open,
    form,
    onChange,
    onClose,
    onSubmit,
    error = '',
    saving = false,
    isEdit = false,
}) {
    if (!open || !form) return null;

    return (
        <>
            <div style={cpStyles.drawerOverlay} onClick={onClose} aria-hidden="true" />
            <aside style={cpStyles.drawer} role="dialog" aria-labelledby="ciclo-drawer-title">
                <div style={cpStyles.drawerHeader}>
                    <div>
                        <h2 id="ciclo-drawer-title" style={cpStyles.drawerTitle}>
                            {isEdit ? 'Editar ciclo escolar' : 'Nuevo ciclo escolar'}
                        </h2>
                        <p style={cpStyles.drawerSubtitle}>
                            {isEdit
                                ? 'Actualice la vigencia y estatus del ciclo seleccionado.'
                                : 'Defina la clave, nombre y periodo de vigencia del ciclo.'}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} style={esTheme.iconBtn} aria-label="Cerrar">
                        ×
                    </button>
                </div>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={cpStyles.drawerBody}>
                        {error ? <p style={cpStyles.formError} role="alert">{error}</p> : null}
                        <FormField label="Clave" hint="Identificador corto, por ejemplo 2025-2026">
                            <input
                                required
                                value={form.clave}
                                onChange={(e) => onChange({ ...form, clave: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                                placeholder="2025-2026"
                            />
                        </FormField>
                        <FormField label="Nombre del ciclo">
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => onChange({ ...form, nombre: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                                placeholder="Ciclo escolar 2025-2026"
                            />
                        </FormField>
                        <FormField label="Fecha de inicio">
                            <input
                                required
                                type="date"
                                value={form.fecha_inicio ?? ''}
                                onChange={(e) => onChange({ ...form, fecha_inicio: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <FormField label="Fecha de fin">
                            <input
                                required
                                type="date"
                                value={form.fecha_fin ?? ''}
                                onChange={(e) => onChange({ ...form, fecha_fin: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            />
                        </FormField>
                        <div style={cpStyles.formSection}>
                            <p style={cpStyles.formSectionTitle}>Configuración</p>
                            <label style={cpStyles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.es_actual)}
                                    onChange={(e) => onChange({ ...form, es_actual: e.target.checked })}
                                />
                                Marcar como ciclo actual
                            </label>
                            <label style={cpStyles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={form.activo !== false}
                                    onChange={(e) => onChange({ ...form, activo: e.target.checked })}
                                />
                                Ciclo activo
                            </label>
                        </div>
                    </div>
                    <div style={cpStyles.drawerFooter}>
                        <button type="button" onClick={onClose} style={esTheme.btnSecondary} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" style={esTheme.btnPrimary} disabled={saving}>
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear ciclo escolar'}
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}

export { FormField };
