import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { ValidationSummary } from '../../components/academic/ValidationSummary';
import { AcademicProgressCard } from '../../components/academic/AcademicProgressCard';
import { DataTable } from '../../components/ui/DataTable';

export function SolicitudCertificacionPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const alumnoIni = Number(params.get('alumno') ?? '');
    const tipoIni = params.get('tipo') === 'parcial' ? 'parcial' : 'termino';

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [tipoCert, setTipoCert] = useState(tipoIni);
    const [resumen, setResumen] = useState(null);

    const cargar = useCallback(async (pk) => {
        if (!Number.isFinite(pk) || pk <= 0) {
            setResumen(null);
            return;
        }
        setBusy(true);
        try {
            const r = await alumnosApi.resumenInstitucional(pk);
            setResumen(r?.data ?? null);
            setError('');
        } catch (e) {
            setResumen(null);
            setError(e?.message ?? 'No fue posible armar la solicitud.');
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        void cargar(alumnoIni);
    }, [alumnoIni, cargar]);

    const bloqueos = useMemo(() => {
        const errs = [];
        if (!Number.isFinite(alumnoIni) || alumnoIni <= 0) {
            errs.push('Seleccione un alumno desde Expediente 360 o desde Trayectoria para iniciar una solicitud válida.');
        }
        if (!resumen?.refs?.matricula_id) errs.push('Debe registrarse primero una matrícula única institucional.');
        if (!(resumen?.materias_cursadas ?? []).length) errs.push('No hay materias cursadas registradas.');
        if (resumen?.contexto_legacy_normativo?.requiere_atencion) {
            errs.push(
                `Importación/certificación pendiente de validaciones normativas (legacy): ${resumen.contexto_legacy_normativo.mensaje_operativo ?? 'Regularice ante Educación Superior.'}`,
            );
        }
        const adv = [];
        if (!(resumen?.trayectoria ?? null)) {
            adv.push('No existe trayectoria consolidada — valide después de cursar/registrar todas las evidencias necesarias antes de cerrar proceso.');
        }
        return { errs, adv };
    }, [resumen, alumnoIni]);

    const puedeCrear = bloqueos.errs.length === 0;
    const motivoBloqueo = !Number.isFinite(alumnoIni) || alumnoIni <= 0
        ? 'No hay alumno seleccionado.'
        : !resumen?.refs?.matricula_id
            ? 'Falta matrícula activa.'
            : !(resumen?.materias_cursadas ?? []).length
                ? 'Faltan materias registradas.'
                : !(resumen?.trayectoria ?? null)
                    ? 'Falta trayectoria.'
                    : resumen?.contexto_legacy_normativo?.requiere_atencion
                        ? 'Hay validación normativa legacy pendiente.'
                        : '';

    async function crearBorrador() {
        const r = resumen?.refs;
        if (!puedeCrear || !r) return;
        setBusy(true);
        setError('');
        setMsg('');
        try {
            const py = await documentosAcademicosApi.create({
                alumno_id: r.alumno_id,
                matricula_id: r.matricula_id,
                ciclo_escolar_id: r.ciclo_escolar_id,
                oferta_academica_id: r.oferta_academica_id ?? undefined,
                subsistema_id: r.subsistema_id ?? undefined,
                region_id: r.region_id ?? undefined,
                institucion_id: r.institucion_id ?? undefined,
                sede_id: r.sede_id ?? undefined,
                tipo_documento: 'certificado',
                tipo_certificacion: tipoCert === 'termino' ? 'total' : 'parcial',
            });
            const id = py?.data?.id;
            setMsg(`Borrador institucional creado como certificado (${tipoCert === 'termino' ? 'total' : 'parcial'}).`);
            if (id) navigate(`/app/documentos/${id}/captura`);
        } catch (e) {
            setError(e?.message ?? 'No se creó la solicitud. Revise reglas DEL backend u observaciones institucionales.');
        } finally {
            setBusy(false);
        }
    }

    const tablaMaterias = useMemo(() => resumen?.materias_cursadas ?? [], [resumen]);
    const checklist = [
        { label: 'Alumno seleccionado', ok: Number.isFinite(alumnoIni) && alumnoIni > 0 },
        { label: 'Matrícula activa', ok: Boolean(resumen?.refs?.matricula_id) },
        { label: 'Plan reconocido', ok: Boolean(resumen?.matricula?.plan_estudios) },
        { label: 'Materias registradas', ok: (resumen?.materias_cursadas ?? []).length > 0 },
        { label: 'Trayectoria consolidada', ok: Boolean(resumen?.trayectoria) },
        { label: 'Sin bloqueos normativos', ok: !Boolean(resumen?.contexto_legacy_normativo?.requiere_atencion) },
    ];

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Solicitud institucional de certificación"
                subtitle="Creación guiada del borrador académico para revisión institucional."
                actions={
                    alumnoIni > 0 ? (
                        <Link className="inst-btn inst-btn-secondary text-sm" to={`/app/alumnos/${alumnoIni}/expediente`}>
                            Volver expediente 360°
                        </Link>
                    ) : null
                }
            />

            {!Number.isFinite(alumnoIni) || alumnoIni <= 0 ? (
                <AlertBox type="danger" message="Seleccione un alumno desde Expediente 360 o desde Trayectoria para iniciar una solicitud válida." />
            ) : null}

            <ValidationSummary ok={bloqueos.errs.length === 0} errores={bloqueos.errs} advertencias={bloqueos.adv} />

            <SectionCard title="Tipo solicitado por la escuela">
                <div className="grid gap-2 text-sm">
                    <label className="flex gap-2">
                        <input type="radio" name="tipo" checked={tipoCert === 'termino'} onChange={() => setTipoCert('termino')} />
                        Certificado de terminación (cumplimiento íntegro del plan institucional)
                    </label>
                    <label className="flex gap-2">
                        <input type="radio" name="tipo" checked={tipoCert === 'parcial'} onChange={() => setTipoCert('parcial')} />
                        Certificado parcial (avance específico o parcialidades del plan vigente en la escuela)
                    </label>
                </div>
            </SectionCard>
            <SectionCard title="Datos para solicitud">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p><strong>Alumno:</strong> {resumen?.alumno?.nombre_completo ?? 'No seleccionado'}</p>
                    <p><strong>Matrícula:</strong> {resumen?.matricula?.clave_matricula ?? 'Sin matrícula activa'}</p>
                    <p><strong>Subsistema:</strong> {resumen?.matricula?.subsistema ?? 'No disponible'}</p>
                    <p><strong>Plan:</strong> {resumen?.matricula?.plan_estudios ?? 'No disponible'}</p>
                    <p><strong>Tipo de certificado:</strong> {tipoCert === 'termino' ? 'Total' : 'Parcial'}</p>
                    <p><strong>Materias incluidas:</strong> {tablaMaterias.length}</p>
                </div>
                <p className="text-xs text-slate-600 mt-2">La emisión oficial se realizará después de la revisión institucional y validación normativa.</p>
            </SectionCard>
            <SectionCard title="Estado de preparación">
                <ul className="grid gap-2 text-sm">
                    {checklist.map((item) => (
                        <li key={item.label} className="flex items-center gap-2">
                            <span className={`status-badge ${item.ok ? 'inst-badge inst-badge-success' : 'inst-badge inst-badge-danger'}`}>{item.ok ? '✓' : '✕'}</span>
                            <span>{item.label}</span>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            <AcademicProgressCard
                titulo="Resumen cursado solicitado por certificación"
                partes={[
                    {
                        label: 'Materias activas registradas',
                        value: tablaMaterias.length,
                        hint: 'Se enviarán a validación institucional y DEC según ciclo cursado cargado.',
                    },
                    {
                        label: 'Plan reconocido',
                        value: resumen?.matricula?.plan_estudios ?? '—',
                        hint: 'La clave institucional de plan no aparece pero queda aplicada desde la oferta asociada en backend.',
                    },
                    {
                        label: 'Promedio acumulado (trayectoria)',
                        value: resumen?.trayectoria?.promedio ?? '—',
                        hint: '',
                    },
                ]}
            />

            <SectionCard title="Historial cursado solicitado sin identificadores técnicos internos">
                <DataTable
                    columns={[
                        { key: 'clave', label: 'Asignatura' },
                        {
                            key: 'nombre',
                            label: 'Denominación',
                            render: (r) => r.nombre,
                        },
                        { key: 'periodo_cursado', label: 'Periodo real cursado' },
                        {
                            key: 'flags',
                            label: '',
                            render: (r) => (
                                <span className="text-[11px] text-slate-500">
                                    {r.dato_congelado_en_certificado ? <span className="rounded bg-slate-200 px-2 py-px">YA en expediente oficial</span> : null}{' '}
                                    {r.bloque_catalogo ? '' : '(captura abierta)'}{' '}
                                </span>
                            ),
                        },
                    ]}
                    rows={tablaMaterias}
                    emptyText="Sin materias asociadas a la matrícula."
                />
            </SectionCard>

            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}

            <div className="flex flex-wrap gap-2">
                <ActionButton disabled={!puedeCrear || busy || !resumen?.refs?.matricula_id} onClick={() => void crearBorrador()}>
                    {busy ? 'Creando solicitud institucional…' : 'Crear borrador y continuar captura'}
                </ActionButton>
            </div>
            {!puedeCrear ? <p className="text-xs text-amber-700">Acción bloqueada: {motivoBloqueo}</p> : null}
            {!puedeCrear ? <p className="subtle-help-text">No se puede crear el borrador hasta resolver los bloqueos.</p> : null}
        </section>
    );
}
