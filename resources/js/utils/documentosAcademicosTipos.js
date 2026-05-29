import { apiGet } from '../api/client';

/** Subsistemas canónicos del catálogo documental. */
export const SUBSISTEMAS_DOCUMENTO = {
    NORMAL: { key: 'NORMAL', label: 'Escuelas Normales', slug: 'normales' },
    UPN: { key: 'UPN', label: 'UPN', slug: 'upn' },
};

/** Mapeo ruta placeholder → tipo documental. */
export const RUTA_A_TIPO_DOCUMENTO = {
    titulos: 'titulo',
    'grados-academicos': 'grado_academico',
    constancias: 'constancia',
    certificacion: 'certificacion',
};

/**
 * Catálogo local (fallback) alineado con config/sices_documentos.php.
 * Se usa si el endpoint aún no responde.
 */
export const CATALOGO_TIPOS_FALLBACK = {
    certificado: {
        key: 'certificado',
        label: 'Certificado',
        descripcion: 'Certificado de estudios o profesionista.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
    certificacion: {
        key: 'certificacion',
        label: 'Certificación',
        descripcion: 'Certificación de estudios.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
    certificado_terminal: {
        key: 'certificado_terminal',
        label: 'Certificado terminal',
        descripcion: 'Certificado de terminación de estudios.',
        subsistemas_permitidos: ['NORMAL'],
    },
    certificacion_parcial: {
        key: 'certificacion_parcial',
        label: 'Certificación parcial',
        descripcion: 'Certificación parcial de estudios.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
    titulo: {
        key: 'titulo',
        label: 'Título',
        descripcion: 'Título profesional o de posgrado.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
    grado_academico: {
        key: 'grado_academico',
        label: 'Grado académico',
        descripcion: 'Documento de grado académico.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
    constancia: {
        key: 'constancia',
        label: 'Constancia',
        descripcion: 'Constancia académica institucional.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
    otro: {
        key: 'otro',
        label: 'Otro documento académico',
        descripcion: 'Tipo genérico.',
        subsistemas_permitidos: ['NORMAL', 'UPN'],
    },
};

/** Capacidades fallback mínimas por tipo/subsistema (solo UI). */
const CAPACIDADES_FALLBACK = {
    'titulo|NORMAL': {
        requiere_payload_json: true,
        requiere_xml_sep: true,
        requiere_firma_sep: true,
        requiere_firma_local: false,
        requiere_folio_control: true,
        requiere_url_short: true,
        requiere_pdf: true,
        requiere_consulta_publica: true,
        permite_jasper_fallback: true,
        permite_editor_plantilla_futuro: true,
        permite_puente_informix: true,
        pipeline_key: 'normal_titulo_sep',
        plantilla_key_default: 'normal.titulo',
    },
    'titulo|UPN': {
        requiere_payload_json: true,
        requiere_xml_sep: true,
        requiere_firma_sep: true,
        requiere_firma_local: false,
        requiere_folio_control: true,
        requiere_url_short: true,
        requiere_pdf: true,
        requiere_consulta_publica: true,
        permite_jasper_fallback: false,
        permite_editor_plantilla_futuro: true,
        permite_puente_informix: false,
        pipeline_key: 'upn_titulo_sep',
        plantilla_key_default: 'upn.titulo',
    },
    'grado_academico|NORMAL': {
        requiere_payload_json: true,
        requiere_xml_sep: true,
        requiere_firma_sep: true,
        requiere_folio_control: true,
        requiere_url_short: true,
        requiere_pdf: true,
        requiere_consulta_publica: true,
        permite_jasper_fallback: true,
        permite_puente_informix: true,
        pipeline_key: 'normal_grado_academico_sep',
        plantilla_key_default: 'normal.grado_academico',
    },
    'grado_academico|UPN': {
        requiere_payload_json: true,
        requiere_xml_sep: false,
        requiere_firma_sep: false,
        requiere_firma_local: true,
        requiere_folio_control: true,
        requiere_pdf: true,
        permite_jasper_fallback: false,
        permite_puente_informix: false,
        pipeline_key: 'upn_grado_academico_pdf',
        plantilla_key_default: 'upn.grado_academico',
    },
    'constancia|NORMAL': {
        requiere_payload_json: true,
        requiere_xml_sep: false,
        requiere_firma_sep: false,
        requiere_firma_local: true,
        requiere_folio_control: true,
        requiere_pdf: true,
        requiere_consulta_publica: false,
        permite_jasper_fallback: true,
        permite_puente_informix: false,
        pipeline_key: 'normal_constancia_pdf',
        plantilla_key_default: 'normal.constancia',
    },
    'constancia|UPN': {
        requiere_payload_json: true,
        requiere_xml_sep: false,
        requiere_firma_sep: false,
        requiere_firma_local: true,
        requiere_folio_control: true,
        requiere_pdf: true,
        requiere_consulta_publica: false,
        permite_jasper_fallback: false,
        permite_puente_informix: false,
        pipeline_key: 'upn_constancia_pdf',
        plantilla_key_default: 'upn.constancia',
    },
};

export function normalizarSubsistemaCatalogo(subsistema) {
    if (!subsistema) return null;
    const s = String(subsistema).toLowerCase();
    if (s === 'normales' || s === 'normal') return 'NORMAL';
    if (s === 'upn') return 'UPN';
    return subsistema.toUpperCase() === 'NORMAL' || subsistema.toUpperCase() === 'UPN' ? subsistema.toUpperCase() : null;
}

export function labelTipoDocumento(tipo) {
    return CATALOGO_TIPOS_FALLBACK[tipo]?.label ?? tipo;
}

export function agruparTiposPorSubsistema(items) {
    const grupos = { NORMAL: [], UPN: [] };
    for (const item of items ?? []) {
        for (const sub of item.subsistemas_permitidos ?? []) {
            if (grupos[sub]) grupos[sub].push(item);
        }
    }
    return grupos;
}

function capacidadesFallback(tipo, subsistema) {
    return CAPACIDADES_FALLBACK[`${tipo}|${subsistema}`] ?? {
        requiere_payload_json: true,
        requiere_xml_sep: false,
        requiere_firma_sep: false,
        requiere_firma_local: false,
        requiere_folio_control: true,
        requiere_url_short: false,
        requiere_pdf: true,
        requiere_consulta_publica: false,
        permite_jasper_fallback: false,
        permite_editor_plantilla_futuro: true,
        permite_puente_informix: false,
        pipeline_key: 'generico_pdf',
        plantilla_key_default: null,
    };
}

export async function fetchTiposDocumentosAcademicos(subsistema) {
    const sub = normalizarSubsistemaCatalogo(subsistema);
    try {
        const res = await apiGet('/catalogos/documentos-academicos/tipos', {
            params: sub ? { subsistema: sub } : {},
        });
        return res?.data ?? [];
    } catch {
        const base = Object.values(CATALOGO_TIPOS_FALLBACK);
        if (!sub) return base;
        return base.filter((t) => t.subsistemas_permitidos.includes(sub));
    }
}

export async function fetchTipoDocumentoAcademico(tipo, subsistema) {
    const sub = normalizarSubsistemaCatalogo(subsistema);
    try {
        const res = await apiGet(`/catalogos/documentos-academicos/tipos/${tipo}`, {
            params: sub ? { subsistema: sub } : {},
        });
        const data = res?.data;
        if (data?.capacidades) return data;
        if (data?.reglas) {
            return { ...data, capacidades: data.reglas };
        }
        return data;
    } catch {
        const meta = CATALOGO_TIPOS_FALLBACK[tipo];
        if (!meta || (sub && !meta.subsistemas_permitidos.includes(sub))) {
            return null;
        }
        const capacidades = capacidadesFallback(tipo, sub);
        return {
            ...meta,
            subsistema: sub,
            capacidades,
            reglas: capacidades,
        };
    }
}

export function requiereXmlSep(cap) {
    return Boolean(cap?.requiere_xml_sep ?? cap?.capacidades?.requiere_xml_sep);
}

export function requiereFirma(cap) {
    const c = cap?.capacidades ?? cap;
    return Boolean(c?.requiere_firma_sep || c?.requiere_firma_local);
}

export function requiereFirmaSep(cap) {
    return Boolean((cap?.capacidades ?? cap)?.requiere_firma_sep);
}

export function requiereFirmaLocal(cap) {
    return Boolean((cap?.capacidades ?? cap)?.requiere_firma_local);
}

export function requierePdf(cap) {
    return Boolean((cap?.capacidades ?? cap)?.requiere_pdf);
}

export function requiereFolio(cap) {
    return Boolean((cap?.capacidades ?? cap)?.requiere_folio_control);
}

export function requiereUrlShort(cap) {
    return Boolean((cap?.capacidades ?? cap)?.requiere_url_short);
}

export function requiereConsultaPublica(cap) {
    return Boolean((cap?.capacidades ?? cap)?.requiere_consulta_publica);
}

export function permiteJasper(cap) {
    return Boolean((cap?.capacidades ?? cap)?.permite_jasper_fallback);
}

export function permiteInformix(cap) {
    return Boolean((cap?.capacidades ?? cap)?.permite_puente_informix);
}

export function permiteEditorPlantilla(cap) {
    return Boolean((cap?.capacidades ?? cap)?.permite_editor_plantilla_futuro);
}
