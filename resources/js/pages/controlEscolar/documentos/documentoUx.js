export function getDocumentoStatusMeta(estatus) {
    const map = {
        en_captura: { bg: '#EEEDFE', color: '#534AB7', label: 'En captura' },
        enviada_validacion: { bg: '#FEF3C7', color: '#BA7517', label: 'Enviada a validación' },
        en_revision: { bg: '#DBEAFE', color: '#185FA5', label: 'En revisión' },
        observada: { bg: '#FFEDD5', color: '#EA580C', label: 'Observada' },
        autorizada: { bg: '#DCFCE7', color: '#0F6E56', label: 'Autorizada' },
        generada: { bg: '#BBF7D0', color: '#15803D', label: 'Autorizada / Generada' },
        rechazada: { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazada' },
        cancelada: { bg: '#F1F5F9', color: '#64748b', label: 'Cancelada' },
        autorizada_generada: { bg: '#BBF7D0', color: '#15803D', label: 'Autorizadas / Generadas' },
        rechazada_cancelada: { bg: '#F1F5F9', color: '#64748b', label: 'Rechazadas / Canceladas' },
    };
    return map[estatus] ?? { bg: '#F1F5F9', color: '#64748b', label: estatus || '—' };
}

export function buildQueryParamsFromFilters(filters) {
    const p = { ...filters };
    Object.keys(p).forEach((k) => {
        if (p[k] === '' || p[k] == null || p[k] === false) delete p[k];
    });
    return p;
}

export function countAdvancedFilters(filters) {
    let n = 0;
    if (filters.tipo_documento_id) n++;
    if (filters.programa_id) n++;
    if (filters.sede_id) n++;
    if (filters.fecha_desde) n++;
    if (filters.fecha_hasta) n++;
    if (filters.solo_mis_solicitudes === '1' || filters.solo_mis_solicitudes === true) n++;
    if (filters.con_observaciones === '1') n++;
    if (filters.a_punto_de_vencer === '1') n++;
    if (filters.requiere_correccion === '1') n++;
    return n;
}
