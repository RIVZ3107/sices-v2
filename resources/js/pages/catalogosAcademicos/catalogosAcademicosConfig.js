export const CATALOGOS_ACADEMICOS_TABS = [
    {
        id: 'instituciones',
        label: 'Instituciones',
        resumenKey: 'instituciones',
        fetch: (api, params) => api.instituciones(params),
        columns: [
            { key: 'clave', label: 'Clave' },
            { key: 'nombre', label: 'Institución' },
            { key: 'subsistema', label: 'Subsistema' },
            { key: 'region', label: 'Región' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['subsistema', 'region', 'activo', 'trazabilidad_migracion'],
    },
    {
        id: 'sedes',
        label: 'Sedes',
        resumenKey: 'sedes',
        fetch: (api, params) => api.sedes(params),
        columns: [
            { key: 'clave', label: 'Clave' },
            { key: 'nombre', label: 'Sede' },
            { key: 'institucion', label: 'Institución' },
            { key: 'subsistema', label: 'Subsistema' },
            { key: 'cct', label: 'CCT' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['subsistema', 'institucion', 'activo', 'trazabilidad_migracion'],
    },
    {
        id: 'programas',
        label: 'Programas',
        resumenKey: 'programas_estudio',
        fetch: (api, params) => api.programas(params),
        columns: [
            { key: 'clave', label: 'Clave' },
            { key: 'nombre', label: 'Programa' },
            { key: 'nivel', label: 'Nivel' },
            { key: 'subsistema', label: 'Subsistema' },
            { key: 'planes_activos', label: 'Planes vigentes' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['subsistema', 'activo', 'trazabilidad_migracion'],
    },
    {
        id: 'planes',
        label: 'Planes de estudio',
        resumenKey: 'planes_estudio',
        fetch: (api, params) => api.planes(params),
        columns: [
            { key: 'clave', label: 'Clave' },
            { key: 'nombre', label: 'Plan' },
            { key: 'programa', label: 'Programa' },
            { key: 'anio_aprobacion', label: 'Año' },
            { key: 'materias_count', label: 'Materias en plan' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['subsistema', 'programa', 'activo', 'trazabilidad_migracion'],
    },
    {
        id: 'materias',
        label: 'Materias',
        resumenKey: 'materias',
        fetch: (api, params) => api.materias(params),
        columns: [
            { key: 'clave', label: 'Clave' },
            { key: 'nombre', label: 'Materia' },
            { key: 'programa', label: 'Programa' },
            { key: 'plan', label: 'Plan' },
            { key: 'creditos', label: 'Créditos' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['programa', 'plan', 'trazabilidad_migracion'],
    },
    {
        id: 'ofertas',
        label: 'Ofertas académicas',
        resumenKey: 'ofertas_academicas',
        fetch: (api, params) => api.ofertasAcademicas(params),
        columns: [
            { key: 'clave', label: 'Clave' },
            { key: 'institucion', label: 'Institución' },
            { key: 'sede', label: 'Sede' },
            { key: 'programa', label: 'Programa' },
            { key: 'plan', label: 'Plan' },
            { key: 'modalidad', label: 'Modalidad' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['institucion', 'programa', 'plan', 'activo', 'trazabilidad_migracion'],
    },
    {
        id: 'estructura',
        label: 'Estructura curricular',
        resumenKey: 'plan_materias',
        isEstructura: true,
        fetch: (api, params) => {
            if (!params.plan_estudio_id) {
                return Promise.resolve({ data: [], meta: { total: 0, current_page: 1, last_page: 1, per_page: 25 }, plan: null });
            }
            return api.planMaterias(params.plan_estudio_id, params);
        },
        columns: [
            { key: 'clave_materia', label: 'Clave' },
            { key: 'nombre_materia', label: 'Materia' },
            { key: 'periodo', label: 'Periodo' },
            { key: 'creditos', label: 'Créditos' },
            { key: 'obligatoria', label: 'Obligatoria', type: 'boolean' },
            { key: 'estatus', label: 'Estatus', type: 'badge' },
        ],
        filters: ['plan', 'trazabilidad_migracion'],
    },
];

export const RESUMEN_CARDS = [
    { key: 'instituciones', label: 'Instituciones', tab: 'instituciones' },
    { key: 'sedes', label: 'Sedes', tab: 'sedes' },
    { key: 'programas_estudio', label: 'Programas', tab: 'programas' },
    { key: 'planes_estudio', label: 'Planes de estudio', tab: 'planes' },
    { key: 'materias', label: 'Materias', tab: 'materias' },
    { key: 'ofertas_academicas', label: 'Ofertas académicas', tab: 'ofertas' },
    { key: 'plan_materias', label: 'Estructura curricular', tab: 'estructura' },
];
