export const PERM_ESCRITURA = [
    'ciclos_escolares.crear',
    'ciclos_escolares.editar',
    'periodos_escolares.crear',
    'periodos_escolares.editar',
    'catalogos.academicos.configurar',
    'catalogos.configurar',
    'gestionar_catalogos',
];

export const ROLES_EDICION = ['superadmin', 'admin', 'sistemas'];

export const TIPOS_PERIODO = [
    { value: 'semestre', label: 'Semestre' },
    { value: 'cuatrimestre', label: 'Cuatrimestre' },
    { value: 'trimestre', label: 'Trimestre' },
    { value: 'anual', label: 'Anual' },
    { value: 'otro', label: 'Otro' },
];

export const CICLO_VACIO = {
    clave: '',
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    es_actual: false,
    activo: true,
};

export const PERIODO_VACIO = {
    clave: '',
    nombre: '',
    tipo_periodo: 'semestre',
    numero_periodo: 1,
    fecha_inicio: '',
    fecha_fin: '',
    fecha_inicio_inscripcion: '',
    fecha_fin_inscripcion: '',
    fecha_inicio_calificaciones: '',
    fecha_fin_calificaciones: '',
    activo: true,
};

export const PASOS_GUIA = [
    { num: 1, title: 'Registrar ciclo escolar', desc: 'Defina clave, nombre y vigencia del ciclo.' },
    { num: 2, title: 'Agregar periodos académicos', desc: 'Configure semestres o periodos dentro del ciclo.' },
    { num: 3, title: 'Marcar ciclo actual', desc: 'Indique qué ciclo está vigente para operación.' },
];

export function formErrorMessage(err, fallback) {
    if (err?.errors && typeof err.errors === 'object') {
        const msgs = Object.values(err.errors).flat().filter(Boolean);
        if (msgs.length) {
            return msgs.join(' ');
        }
    }
    const msg = err?.message ?? '';
    if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden')) {
        return 'No tiene permisos para realizar esta acción.';
    }
    return msg || fallback;
}

export function fechaOpcional(value) {
    return value && String(value).trim() !== '' ? value : null;
}

export function buildCicloPayload(form) {
    return {
        clave: form.clave?.trim(),
        nombre: form.nombre?.trim(),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        es_actual: Boolean(form.es_actual),
        activo: form.activo !== false,
    };
}

export function buildPeriodoPayload(form) {
    return {
        clave: form.clave?.trim(),
        nombre: form.nombre?.trim(),
        tipo_periodo: form.tipo_periodo,
        numero_periodo: Number(form.numero_periodo),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        fecha_inicio_inscripcion: fechaOpcional(form.fecha_inicio_inscripcion),
        fecha_fin_inscripcion: fechaOpcional(form.fecha_fin_inscripcion),
        fecha_inicio_calificaciones: fechaOpcional(form.fecha_inicio_calificaciones),
        fecha_fin_calificaciones: fechaOpcional(form.fecha_fin_calificaciones),
        activo: form.activo !== false,
    };
}

export function validarFechasCiclo(form) {
    if (form.fecha_inicio && form.fecha_fin && form.fecha_inicio > form.fecha_fin) {
        return 'La fecha de fin debe ser posterior o igual a la fecha de inicio.';
    }
    return '';
}

export function validarFechasPeriodo(form, ciclo) {
    const base = validarFechasCiclo(form);
    if (base) return base;

    if (ciclo?.fecha_inicio && form.fecha_inicio && form.fecha_inicio < ciclo.fecha_inicio) {
        return 'El periodo debe iniciar dentro del rango del ciclo escolar.';
    }
    if (ciclo?.fecha_fin && form.fecha_fin && form.fecha_fin > ciclo.fecha_fin) {
        return 'El periodo debe concluir dentro del rango del ciclo escolar.';
    }
    if (form.fecha_inicio_inscripcion && form.fecha_fin_inscripcion
        && form.fecha_inicio_inscripcion > form.fecha_fin_inscripcion) {
        return 'La ventana de inscripción no es válida.';
    }
    if (form.fecha_inicio_calificaciones && form.fecha_fin_calificaciones
        && form.fecha_inicio_calificaciones > form.fecha_fin_calificaciones) {
        return 'La ventana de calificaciones no es válida.';
    }
    return '';
}

export function formatFechaRango(inicio, fin) {
    if (!inicio && !fin) return '—';
    if (inicio && fin) return `${inicio} — ${fin}`;
    return inicio || fin || '—';
}
