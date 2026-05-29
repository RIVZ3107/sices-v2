import { Link } from 'react-router-dom';

function fila(label, valor) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 13 }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{valor || '—'}</span>
        </div>
    );
}

/**
 * Tarjeta de alumno para confirmar selección (paso 1).
 * @param {{ datos: object, onSeleccionar: () => void, seleccionado?: boolean, busy?: boolean }} props
 */
export function AlumnoSeleccionCard({ datos, onSeleccionar, seleccionado = false, busy = false }) {
    const nombre =
        datos.nombre_completo
        ?? [datos.nombre, datos.primer_apellido, datos.segundo_apellido].filter(Boolean).join(' ');

    return (
        <article
            style={{
                border: seleccionado ? '2px solid #185FA5' : '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '14px 16px',
                background: seleccionado ? '#eff6ff' : '#fff',
            }}
        >
            <div className="grid gap-2">
                {fila('Nombre completo', nombre)}
                {fila('CURP', datos.curp)}
                {fila('Matrícula', datos.matricula ?? datos.clave_matricula)}
                {fila('Institución', datos.institucion)}
                {fila('Subsistema', datos.subsistema)}
                {fila('Programa / plan', datos.programa_plan ?? datos.programa)}
                {fila('Ciclo escolar', datos.ciclo_escolar ?? datos.ciclo)}
                {fila('Estado académico', datos.estatus ?? datos.estado)}
            </div>
            {!seleccionado ? (
                <button
                    type="button"
                    className="inst-btn inst-btn-primary text-sm mt-3"
                    disabled={busy}
                    onClick={onSeleccionar}
                >
                    Seleccionar alumno
                </button>
            ) : (
                <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 600, color: '#0F6E56' }}>
                    Alumno seleccionado para la solicitud documental.
                </p>
            )}
        </article>
    );
}

/**
 * Resumen de expediente tras selección (paso 2).
 */
export function ExpedienteResumenCard({ resumen }) {
    const a = resumen?.alumno ?? {};
    const m = resumen?.matricula ?? {};
    const t = resumen?.trayectoria ?? {};
    const promedio = t.promedio ?? t.promedio_aprovechamiento ?? null;

    const datos = {
        nombre_completo: a.nombre_completo,
        curp: a.curp,
        matricula: m.clave_matricula,
        institucion: m.institucion,
        subsistema: m.subsistema,
        programa_plan: m.programa && m.plan_estudios ? `${m.programa} · ${m.plan_estudios}` : m.programa,
        ciclo: m.ciclo_actual,
        estatus: a.estatus ?? m.estado,
    };

    return (
        <div className="grid gap-3">
            <AlumnoSeleccionCard datos={datos} seleccionado />
            {promedio != null && promedio !== '' ? (
                <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                    Promedio registrado: <strong>{promedio}</strong>
                </p>
            ) : null}
            <Link
                to={resumen?.refs?.alumno_id ? `/app/alumnos/${resumen.refs.alumno_id}/expediente` : '/app/control-escolar/expedientes'}
                className="inst-btn inst-btn-secondary text-sm"
                style={{ width: 'fit-content' }}
            >
                Ver expediente completo
            </Link>
        </div>
    );
}
