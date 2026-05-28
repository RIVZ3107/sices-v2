const BADGE = {
    ok: 'inst-badge inst-badge-success',
    warn: 'inst-badge inst-badge-warning',
    err: 'inst-badge inst-badge-danger',
    muted: 'inst-badge inst-badge-secondary',
    info: 'inst-badge inst-badge-info',
};

export function estadoPayloadLabel(doc) {
    const ec = doc?.estado_cadena;
    const ex = doc?.estado_xml;
    if (String(ec ?? '').startsWith('error') || String(ex ?? '').startsWith('error')) {
        return { label: 'Error payload', className: BADGE.err };
    }
    if (ec === 'generada' || ex === 'generado' || ex === 'validado') {
        return { label: 'Generado', className: BADGE.ok };
    }
    return { label: 'No generado', className: BADGE.muted };
}

export function estadoCadenaLabel(estado) {
    const e = String(estado ?? '');
    if (e === 'generada') return { label: 'Generada', className: BADGE.ok };
    if (e.startsWith('error')) return { label: 'Error cadena', className: BADGE.err };
    return { label: 'No generada', className: BADGE.muted };
}

export function estadoXmlLabel(estado) {
    const e = String(estado ?? '');
    if (e === 'validado') return { label: 'Validado', className: BADGE.ok };
    if (e === 'generado') return { label: 'Generado', className: BADGE.info };
    if (e.startsWith('error')) return { label: 'Error XML', className: BADGE.err };
    return { label: 'No generado', className: BADGE.muted };
}

export function estadoFirmaLabel(doc) {
    const ef = doc?.estado_firma ?? 'no_firmado';
    if (ef === 'firmado') return { label: 'Firmado', className: BADGE.ok };
    if (ef === 'firmando') return { label: 'Firmando', className: BADGE.info };
    if (String(ef).includes('error')) return { label: 'Error firma', className: BADGE.err };
    if (doc?.listo_para_firma) return { label: 'Listo proceso técnico', className: BADGE.info };
    return { label: 'No firmado', className: BADGE.muted };
}

export function estadoPreflightLabel(preflight) {
    if (!preflight) return { label: 'Pendiente', className: BADGE.muted };
    if (preflight.ok) return { label: 'Correcto', className: BADGE.ok };
    return { label: 'Con errores', className: BADGE.err };
}

export function TecnicoEstadoBadge({ estado }) {
    const { label, className } = estado ?? { label: '—', className: BADGE.muted };
    return <span className={className}>{label}</span>;
}
