import { Link } from 'react-router-dom';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';

function fila(label, valor) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 130px) 1fr', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{sanitizeInstitutionalLabel(valor)}</span>
        </div>
    );
}

/**
 * Tarjeta compacta del alumno seleccionado o candidato.
 */
export function AlumnoSeleccionCard({ datos, onSeleccionar, seleccionado = false, busy = false, compact = false }) {
    const nombre =
        datos.nombre_completo
        ?? [datos.nombre, datos.primer_apellido, datos.segundo_apellido].filter(Boolean).join(' ');

    if (compact && seleccionado) {
        return (
            <article
                style={{
                    border: '1px solid #bfdbfe',
                    borderRadius: 10,
                    padding: '14px 16px',
                    background: 'linear-gradient(180deg, #eff6ff 0%, #fff 100%)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#185FA5', textTransform: 'uppercase' }}>
                            Alumno seleccionado
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{nombre}</p>
                    </div>
                </div>
                <div
                    className="grid gap-1"
                    style={{
                        marginTop: 12,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 8,
                    }}
                >
                    {fila('CURP', datos.curp)}
                    {fila('Matrícula', datos.matricula ?? datos.clave_matricula)}
                    {fila('Institución', datos.institucion)}
                    {fila('Subsistema', datos.subsistema)}
                    {fila('Programa / plan', datos.programa_plan ?? datos.programa)}
                    {fila('Ciclo escolar', datos.ciclo_escolar ?? datos.ciclo)}
                </div>
            </article>
        );
    }

    return (
        <article
            style={{
                border: seleccionado ? '2px solid #185FA5' : '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px 14px',
                background: seleccionado ? '#eff6ff' : '#fff',
            }}
        >
            <div className="grid gap-2">
                {fila('Nombre completo', nombre)}
                {fila('CURP', datos.curp)}
                {fila('Matrícula', datos.matricula ?? datos.clave_matricula)}
                {!compact ? (
                    <>
                        {fila('Institución', datos.institucion)}
                        {fila('Subsistema', datos.subsistema)}
                        {fila('Programa / plan', datos.programa_plan ?? datos.programa)}
                        {fila('Ciclo escolar', datos.ciclo_escolar ?? datos.ciclo)}
                        {fila('Estado académico', datos.estatus ?? datos.estado)}
                    </>
                ) : null}
            </div>
            {!seleccionado && onSeleccionar ? (
                <button
                    type="button"
                    className="inst-btn inst-btn-primary text-sm mt-3"
                    disabled={busy}
                    onClick={onSeleccionar}
                >
                    Seleccionar alumno
                </button>
            ) : null}
        </article>
    );
}

export function ExpedienteResumenCard({ resumen }) {
    const a = resumen?.alumno ?? {};
    const m = resumen?.matricula ?? {};
    return (
        <AlumnoSeleccionCard
            datos={{
                nombre_completo: a.nombre_completo,
                curp: a.curp,
                matricula: m.clave_matricula,
                institucion: m.institucion,
                subsistema: m.subsistema,
                programa_plan: m.programa && m.plan_estudios ? `${m.programa}` : m.programa,
                ciclo_escolar: m.ciclo_actual,
            }}
            seleccionado
            compact
        />
    );
}
