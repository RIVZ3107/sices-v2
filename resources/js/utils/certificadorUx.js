import { labelTipoDocumento } from './documentosAcademicosTipos';

/** Acciones visibles en bandeja y detalle del Certificador. */
export const ACCIONES_CERTIFICADOR = new Set([
    'validar_informacion',
    'devolver_observaciones',
]);

export const CERTIFICADOR_TABS = [
    { key: 'en-validacion-certificador', label: 'Pendientes de validar', activa: true },
    { key: 'observado-por-certificador', label: 'Observados / devueltos', activa: false },
    { key: 'validado-por-certificador', label: 'Historial validados', activa: false },
];

export function filtrarAccionesCertificador(acciones = []) {
    return acciones.filter((a) => ACCIONES_CERTIFICADOR.has(a.accion));
}

export function etiquetaTipoDocumental(tipo) {
    return labelTipoDocumento(tipo) || tipo || '—';
}

/**
 * Checklist académico institucional para revisión del Certificador.
 * @param {object} data - payload de revision-institucional
 */
export function checklistAcademicoCertificador(data) {
    const alumno = data?.alumno;
    const mat = data?.matricula;
    const trayectoria = data?.trayectoria;
    const materias = data?.materias_cursadas ?? [];
    const promedio = trayectoria?.promedio ?? trayectoria?.promedio_aprovechamiento;
    const errores = data?.validacion?.errores ?? [];
    const sinDuplicado = !errores.some((e) => /duplicad|activo/i.test(String(e)));

    return [
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
}
