import { esTheme } from '../../educacionSuperior/esTheme';
import { TIPOS_PERIODO } from './ciclosShared';
import { cpStyles } from './ciclosPeriodosStyles';
import { FormField } from './CicloFormDrawer';

export function PeriodoFormDrawer({
    open,
    form,
    onChange,
    onClose,
    onSubmit,
    error = '',
    saving = false,
    isEdit = false,
    cicloLabel = '',
}) {
    if (!open || !form) return null;

    return (
        <>
            <div style={cpStyles.drawerOverlay} onClick={onClose} aria-hidden="true" />
            <aside style={cpStyles.drawer} role="dialog" aria-labelledby="periodo-drawer-title">
                <div style={cpStyles.drawerHeader}>
                    <div>
                        <h2 id="periodo-drawer-title" style={cpStyles.drawerTitle}>
                            {isEdit ? 'Editar periodo escolar' : 'Agregar periodo escolar'}
                        </h2>
                        <p style={cpStyles.drawerSubtitle}>
                            {cicloLabel
                                ? `Periodo dentro del ciclo ${cicloLabel}.`
                                : 'Configure el periodo académico y sus ventanas operativas.'}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} style={esTheme.iconBtn} aria-label="Cerrar">
                        ×
                    </button>
                </div>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={cpStyles.drawerBody}>
                        {error ? <p style={cpStyles.formError} role="alert">{error}</p> : null}
                        <FormField label="Clave del periodo">
                            <input
                                required
                                value={form.clave}
                                onChange={(e) => onChange({ ...form, clave: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                                placeholder="2025-2026-S1"
                            />
                        </FormField>
                        <FormField label="Nombre del periodo">
                            <input
                                required
                                value={form.nombre}
                                onChange={(e) => onChange({ ...form, nombre: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                                placeholder="Primer semestre"
                            />
                        </FormField>
                        <FormField label="Tipo de periodo">
                            <select
                                required
                                value={form.tipo_periodo}
                                onChange={(e) => onChange({ ...form, tipo_periodo: e.target.value })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
                            >
                                {TIPOS_PERIODO.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Número de periodo" hint="Debe ser único por tipo dentro del ciclo">
                            <input
                                required
                                type="number"
                                min="1"
                                max="255"
                                value={form.numero_periodo}
                                onChange={(e) => onChange({ ...form, numero_periodo: Number(e.target.value) })}
                                style={{ ...esTheme.inputSearch, width: '100%' }}
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
                            <p style={cpStyles.formSectionTitle}>Ventana de inscripción (opcional)</p>
                            <FormField label="Inicio">
                                <input
                                    type="date"
                                    value={form.fecha_inicio_inscripcion ?? ''}
                                    onChange={(e) => onChange({ ...form, fecha_inicio_inscripcion: e.target.value })}
                                    style={{ ...esTheme.inputSearch, width: '100%' }}
                                />
                            </FormField>
                            <FormField label="Fin">
                                <input
                                    type="date"
                                    value={form.fecha_fin_inscripcion ?? ''}
                                    onChange={(e) => onChange({ ...form, fecha_fin_inscripcion: e.target.value })}
                                    style={{ ...esTheme.inputSearch, width: '100%' }}
                                />
                            </FormField>
                        </div>
                        <div style={cpStyles.formSection}>
                            <p style={cpStyles.formSectionTitle}>Ventana de calificaciones (opcional)</p>
                            <FormField label="Inicio">
                                <input
                                    type="date"
                                    value={form.fecha_inicio_calificaciones ?? ''}
                                    onChange={(e) => onChange({ ...form, fecha_inicio_calificaciones: e.target.value })}
                                    style={{ ...esTheme.inputSearch, width: '100%' }}
                                />
                            </FormField>
                            <FormField label="Fin">
                                <input
                                    type="date"
                                    value={form.fecha_fin_calificaciones ?? ''}
                                    onChange={(e) => onChange({ ...form, fecha_fin_calificaciones: e.target.value })}
                                    style={{ ...esTheme.inputSearch, width: '100%' }}
                                />
                            </FormField>
                        </div>
                        <label style={cpStyles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={form.activo !== false}
                                onChange={(e) => onChange({ ...form, activo: e.target.checked })}
                            />
                            Periodo activo
                        </label>
                    </div>
                    <div style={cpStyles.drawerFooter}>
                        <button type="button" onClick={onClose} style={esTheme.btnSecondary} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" style={esTheme.btnPrimary} disabled={saving}>
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar periodo'}
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}
