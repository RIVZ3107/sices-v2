/**
 * Etiqueta de actualización al estilo tableros institucionales SICES v2.
 */
export function formatDashboardUpdatedAt(date = new Date()) {
    return `Actualizado: ${date.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`;
}
