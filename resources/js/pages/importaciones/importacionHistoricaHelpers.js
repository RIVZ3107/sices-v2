/** Campos alineados con StoreImportacionHistoricaMateriasRequest */
export const FILAS_PAYLOAD_FIELDS = [
    'clave',
    'nombre',
    'calificacion_final',
    'tipo_periodo_curricular',
    'numero_periodo_curricular',
    'etiqueta_periodo_curricular',
    'periodo',
    'creditos',
    'tipo_evaluacion',
    'estatus_acreditacion',
    'semestre_dec',
];

export function emptyImportRow() {
    return {
        clave: '',
        nombre: '',
        calificacion_final: '',
        tipo_periodo_curricular: 'semestre',
        numero_periodo_curricular: '',
        etiqueta_periodo_curricular: '',
        periodo: '',
        creditos: '',
        tipo_evaluacion: '',
        estatus_acreditacion: '',
        semestre_dec: '',
    };
}

/** Normaliza cabeceras tipo CSV/plantilla a claves internas */
export function normalizeHeader(h) {
    const x = String(h || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/ó/g, 'o')
        .replace(/í/g, 'i');
    const map = {
        clave: 'clave',
        materia: 'nombre',
        nombre: 'nombre',
        nombre_materia: 'nombre',
        calificacion: 'calificacion_final',
        calificacion_final: 'calificacion_final',
        tipo_periodo_curricular: 'tipo_periodo_curricular',
        tipo_periodo: 'tipo_periodo_curricular',
        numero_periodo_curricular: 'numero_periodo_curricular',
        numero_periodo: 'numero_periodo_curricular',
        etiqueta_periodo_curricular: 'etiqueta_periodo_curricular',
        etiqueta_periodo: 'etiqueta_periodo_curricular',
        periodo: 'periodo',
        creditos: 'creditos',
        tipo_evaluacion: 'tipo_evaluacion',
        estatus_acreditacion: 'estatus_acreditacion',
        estatus: 'estatus_acreditacion',
        estado: 'estatus_acreditacion',
        semestre_dec: 'semestre_dec',
        semestre: 'semestre_dec',
    };
    return map[x] || null;
}

/**
 * Parsea texto pegado (TSV o CSV). Primera fila opcionalmente cabeceras.
 * @returns {ReturnType<typeof emptyImportRow>[]}
 */
export function parseSpreadsheetPaste(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return [];

    const lines = text.split(/\r?\n/).filter((ln) => ln.trim() !== '');
    if (lines.length === 0) return [];

    const delim = lines[0].includes('\t') ? '\t' : ',';

    const splitLine = (ln) => {
        const parts = ln.split(delim);
        return parts.map((c) => String(c).trim().replace(/^"|"$/g, ''));
    };

    const firstCells = splitLine(lines[0]);
    const headerKeys = firstCells.map(normalizeHeader);
    const looksLikeHeader = headerKeys.some((k) => k === 'clave');

    const out = [];

    if (!looksLikeHeader) {
        for (let i = 0; i < lines.length; i++) {
            const cells = splitLine(lines[i]);
            const row = emptyImportRow();
            FILAS_PAYLOAD_FIELDS.forEach((field, idx) => {
                if (cells[idx] !== undefined && cells[idx] !== '') {
                    row[field] = cells[idx];
                }
            });
            if (String(row.clave || '').trim() !== '') {
                out.push(row);
            }
        }
        return out;
    }

    for (let i = 1; i < lines.length; i++) {
        const cells = splitLine(lines[i]);
        const row = emptyImportRow();
        headerKeys.forEach((key, idx) => {
            if (key && cells[idx] !== undefined && cells[idx] !== '') {
                row[key] = cells[idx];
            }
        });
        if (String(row.clave || '').trim() !== '') {
            out.push(row);
        }
    }
    return out;
}

/** Convierte filas UI a payload API (números / null) */
export function toApiFilasPayload(rowsUi) {
    return rowsUi
        .filter((r) => String(r.clave || '').trim() !== '')
        .map((r) => {
            const o = {
                clave: String(r.clave).trim(),
                nombre: r.nombre ? String(r.nombre).trim() : null,
                tipo_periodo_curricular: r.tipo_periodo_curricular
                    ? String(r.tipo_periodo_curricular).trim()
                    : null,
                numero_periodo_curricular:
                    r.numero_periodo_curricular !== '' && r.numero_periodo_curricular != null
                        ? Number.parseInt(String(r.numero_periodo_curricular), 10)
                        : null,
                etiqueta_periodo_curricular: r.etiqueta_periodo_curricular
                    ? String(r.etiqueta_periodo_curricular).trim()
                    : null,
                periodo: r.periodo ? String(r.periodo).trim() : null,
                tipo_evaluacion: r.tipo_evaluacion ? String(r.tipo_evaluacion).trim() : null,
                estatus_acreditacion: r.estatus_acreditacion
                    ? String(r.estatus_acreditacion).trim()
                    : null,
                estado: r.estatus_acreditacion ? String(r.estatus_acreditacion).trim() : null,
            };
            if (r.calificacion_final !== '' && r.calificacion_final != null) {
                const n = Number(String(r.calificacion_final).replace(',', '.'));
                if (!Number.isNaN(n)) {
                    o.calificacion_final = n;
                    o.calificacion = n;
                }
            }
            if (r.creditos !== '' && r.creditos != null) {
                const c = Number.parseInt(String(r.creditos), 10);
                if (!Number.isNaN(c)) o.creditos = c;
            }
            if (r.semestre_dec !== '' && r.semestre_dec != null) {
                const s = Number.parseInt(String(r.semestre_dec), 10);
                if (!Number.isNaN(s)) o.semestre_dec = s;
            }
            return o;
        });
}

export function detectDuplicateKeys(rowsUi) {
    const seen = new Map();
    const dup = [];
    rowsUi.forEach((r, idx) => {
        const clave = String(r.clave || '').trim();
        const periodo = String(r.periodo || '').trim();
        if (!clave) return;
        const k = `${clave}@@${periodo}`;
        if (seen.has(k)) {
            dup.push({ indice: idx, clave, periodo, primero: seen.get(k) });
        } else {
            seen.set(k, idx);
        }
    });
    return dup;
}
