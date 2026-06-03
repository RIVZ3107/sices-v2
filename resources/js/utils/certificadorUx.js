import { labelTipoDocumento } from './documentosAcademicosTipos';

/** Acciones visibles en bandeja y detalle del Certificador. */
export const ACCIONES_CERTIFICADOR = new Set([
    'validar_informacion',
    'devolver_observaciones',
]);

export const CERTIFICADOR_TABS = [
    { key: 'en-validacion-certificador', label: 'Pendientes de validación', activa: true },
    { key: 'observado-por-certificador', label: 'Observados / devueltos', activa: false },
    { key: 'validado-por-certificador', label: 'Historial validados', activa: false },
];

export function filtrarAccionesCertificador(acciones = []) {
    return acciones.filter((a) => ACCIONES_CERTIFICADOR.has(a.accion));
}

export function etiquetaTipoDocumental(tipo) {
    return labelTipoDocumento(tipo) || tipo || '—';
}

/** @typedef {'ok'|'warning'|'error'} ChecklistSeveridad */

/**
 * Advertencias no bloqueantes del resumen de validación académica.
 * @param {object} data
 * @returns {string[]}
 */
export function advertenciasAcademicasCertificador(data) {
    const resumen = data?.validacion?.resumen;
    if (!resumen?.validaciones) {
        return [];
    }
    const out = [];
    Object.values(resumen.validaciones).forEach((sec) => {
        (sec?.advertencias ?? []).forEach((a) => out.push(String(a)));
    });
    return [...new Set(out)];
}

/**
 * Checklist académico institucional para revisión del Certificador.
 * @param {object} data - payload de revision-institucional
 * @param {{ ocultarBloqueosSiPuedeValidar?: boolean, puedeValidar?: boolean }} [opts]
 * @returns {Array<{ key: string, label: string, ok: boolean, severidad: ChecklistSeveridad }>}
 */
export function checklistAcademicoCertificador(data, opts = {}) {
    const alumno = data?.alumno;
    const mat = data?.matricula;
    const trayectoria = data?.trayectoria;
    const materias = data?.materias_cursadas ?? [];
    const promedio = trayectoria?.promedio ?? trayectoria?.promedio_aprovechamiento;
    const errores = data?.validacion?.errores ?? [];
    const sinDuplicado = !errores.some((e) => /duplicad|activo/i.test(String(e)));
    const ocultarBloqueos = opts.ocultarBloqueosSiPuedeValidar && opts.puedeValidar;

    const items = [
        {
            key: 'alumno',
            label: 'Datos del alumno completos',
            ok: Boolean(alumno?.curp && alumno?.nombre_completo),
        },
        {
            key: 'matricula',
            label: 'Matrícula vigente',
            ok: Boolean(mat?.matricula),
        },
        {
            key: 'programa',
            label: 'Programa identificado',
            ok: Boolean(data?.programa?.nombre || data?.programa),
        },
        {
            key: 'plan',
            label: 'Plan identificado',
            ok: Boolean(data?.plan?.nombre || data?.plan),
        },
        {
            key: 'trayectoria',
            label: 'Trayectoria disponible',
            ok: Boolean(trayectoria),
        },
        {
            key: 'materias',
            label: 'Materias registradas',
            ok: materias.length > 0,
        },
        {
            key: 'promedio',
            label: 'Promedio registrado (si aplica)',
            ok: promedio == null || promedio === '' || Number(promedio) > 0,
        },
        {
            key: 'duplicado',
            label: 'Sin solicitud duplicada activa',
            ok: sinDuplicado,
        },
    ];

    const conSeveridad = items.map((item) => ({
        ...item,
        severidad: item.ok ? 'ok' : ocultarBloqueos ? 'warning' : 'error',
    }));

    advertenciasAcademicasCertificador(data).forEach((texto, i) => {
        conSeveridad.push({
            key: `advertencia-${i}`,
            label: texto,
            ok: false,
            severidad: 'warning',
        });
    });

    return conSeveridad;
}
