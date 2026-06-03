import {
    bandejaEtapaLabel,
    bandejaSiguienteAccion,
    fmtUltimoMovimiento,
    institucionCct,
} from './bandejaWorkflow';
import { etiquetaTipoDocumental } from './certificadorUx';

export function programaPlanLabel(row) {
    const prog = row?.programa?.nombre ?? '—';
    const plan = row?.plan?.nombre;
    if (plan && plan !== '—') {
        return `${prog} · ${plan}`;
    }
    return prog;
}

/** Columnas de bandeja para el rol Certificador. */
export function columnasBandejaCertificador() {
    return [
        {
            key: 'alumno',
            label: 'Alumno',
            render: (r) => r.alumno?.nombre_completo ?? '—',
        },
        {
            key: 'curp',
            label: 'CURP',
            render: (r) => r.alumno?.curp ?? '—',
        },
        {
            key: 'matricula',
            label: 'Matrícula',
            render: (r) => r.matricula?.matricula ?? '—',
        },
        {
            key: 'institucion',
            label: 'Institución / CCT',
            render: (r) => institucionCct(r),
        },
        {
            key: 'programa',
            label: 'Programa / plan',
            render: (r) => programaPlanLabel(r),
        },
        {
            key: 'tipo',
            label: 'Tipo documental',
            render: (r) => etiquetaTipoDocumental(r.tipo_documento),
        },
        {
            key: 'etapa',
            label: 'Etapa',
            render: (r) => bandejaEtapaLabel(r),
        },
        {
            key: 'movimiento',
            label: 'Último movimiento',
            render: (r) => fmtUltimoMovimiento(r),
        },
        {
            key: 'siguiente',
            label: 'Siguiente acción',
            render: (r) => bandejaSiguienteAccion(r),
        },
    ];
}
