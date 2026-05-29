/**
 * Acciones institucionales devueltas por API (`workflow.acciones_permitidas`).
 */
export function docTieneAccion(doc, accion) {
    const acciones = doc?.workflow?.acciones_permitidas ?? [];
    return acciones.some((a) => a.accion === accion);
}

export function docAccion(doc, accion) {
    return (doc?.workflow?.acciones_permitidas ?? []).find((a) => a.accion === accion) ?? null;
}

export function docEtapaInstitucional(doc) {
    return doc?.workflow?.estado_actual ?? doc?.etapa_institucional ?? doc?.metadata?.etapa_institucional ?? null;
}

export function docEtapaLabel(doc) {
    return doc?.workflow?.estado_actual_label ?? docEtapaInstitucional(doc) ?? '—';
}
