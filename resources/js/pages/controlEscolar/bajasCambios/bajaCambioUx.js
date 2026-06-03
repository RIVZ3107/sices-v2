export function getBajaCambioStatusMeta(estatus) {
    const map = {
        solicitada: { bg: '#DBEAFE', color: '#185FA5', label: 'Solicitada' },
        en_revision: { bg: '#FEF3C7', color: '#BA7517', label: 'En revisión' },
        observada: { bg: '#FFEDD5', color: '#EA580C', label: 'Observada' },
        en_dictamen: { bg: '#EEEDFE', color: '#534AB7', label: 'En dictamen' },
        aprobada: { bg: '#DCFCE7', color: '#0F6E56', label: 'Aprobada' },
        rechazada: { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazada' },
        por_aplicar: { bg: '#BFDBFE', color: '#1D4ED8', label: 'Por aplicar' },
        aplicada: { bg: '#BBF7D0', color: '#15803D', label: 'Aplicada' },
        cancelada: { bg: '#F1F5F9', color: '#64748b', label: 'Cancelada' },
    };
    return map[estatus] ?? { bg: '#F1F5F9', color: '#64748b', label: estatus || '—' };
}

export function getBajaCambioPriorityMeta(prioridad) {
    const map = {
        baja: { bg: '#F1F5F9', color: '#64748b', label: 'Baja' },
        media: { bg: '#FEF3C7', color: '#BA7517', label: 'Media' },
        alta: { bg: '#FFEDD5', color: '#EA580C', label: 'Alta' },
        critica: { bg: '#FEE2E2', color: '#991B1B', label: 'Crítica' },
    };
    return map[prioridad] ?? map.media;
}

export function countAdvancedFilters(filters) {
    let n = 0;
    if (filters.periodo_id) n++;
    if (filters.etapa) n++;
    if (filters.prioridad) n++;
    if (filters.motivo) n++;
    if (filters.programa_id) n++;
    if (filters.fecha_desde) n++;
    if (filters.fecha_hasta) n++;
    if (filters.vencidas === '1') n++;
    if (filters.criticas === '1') n++;
    if (filters.con_observaciones === '1') n++;
    if (filters.documentos_pendientes === '1') n++;
    return n;
}
