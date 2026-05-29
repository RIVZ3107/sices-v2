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
import { TipoDocumentalCapacidadesCard } from '../../components/documentos/TipoDocumentalCapacidadesCard';
import {
    fetchTiposDocumentosAcademicos,
    fetchTipoDocumentoAcademico,
    labelTipoDocumento,
    normalizarSubsistemaCatalogo,
} from '../../utils/documentosAcademicosTipos';

const AVISO_CE =
    'Control Escolar solo inicia la solicitud documental. La validación, folio, procesamiento, firma y resultado final corresponden a las etapas institucionales posteriores (Educación Superior; incidencias técnicas: Sistemas).';

const AYUDA_TIPO =
    'Selecciona el tipo documental autorizado para tu subsistema y plan académico. El catálogo y sus reglas las administra Sistemas; el sistema aplicará las capacidades en etapas posteriores.';

function resolverTipoDocumentalCatalogo(tipoCert, tipoDocumentoSeleccionado) {
    if (tipoDocumentoSeleccionado) return tipoDocumentoSeleccionado;
    if (tipoCert === 'parcial') return 'certificacion_parcial';
    return 'certificado';
}

function mensajeErrorDuplicado(texto) {
    if (!texto) return false;
    return texto.includes('documento activo') || texto.includes('expediente antes de crear');
}

export function SolicitudCertificacionPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const alumnoIni = Number(params.get('alumno') ?? '');
    const tipoIni = params.get('tipo') === 'parcial' ? 'parcial' : 'termino';

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [tipoCert, setTipoCert] = useState(tipoIni);
    const [tipoDocumento, setTipoDocumento] = useState('');
    const [tiposCatalogo, setTiposCatalogo] = useState([]);
    const [catalogoFallback, setCatalogoFallback] = useState(false);
    const [capacidades, setCapacidades] = useState(null);
    const [resumen, setResumen] = useState(null);

    const subsistemaClave = useMemo(() => {
        const raw = resumen?.matricula?.subsistema_clave ?? resumen?.refs?.subsistema_clave ?? resumen?.matricula?.subsistema;
        return normalizarSubsistemaCatalogo(raw);
    }, [resumen]);

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

    useEffect(() => {
        if (!subsistemaClave) {
            setTiposCatalogo([]);
            return;
        }
        let cancel = false;
        void fetchTiposDocumentosAcademicos(subsistemaClave).then((items) => {
            if (cancel) return;
            setTiposCatalogo(items);
            setCatalogoFallback(items.length > 0 && !items[0]?.capacidades);
            if (!tipoDocumento && items.length) {
                const preferido = items.find((t) => t.key === (tipoIni === 'parcial' ? 'certificacion_parcial' : 'certificado'));
                setTipoDocumento(preferido?.key ?? items[0].key);
            }
        });
        return () => {
            cancel = true;
        };
    }, [subsistemaClave, tipoIni, tipoDocumento]);

    const tipoEfectivo = resolverTipoDocumentalCatalogo(tipoCert, tipoDocumento);

    useEffect(() => {
        if (!tipoEfectivo || !subsistemaClave) {
            setCapacidades(null);
            return;
        }
        let cancel = false;
        void fetchTipoDocumentoAcademico(tipoEfectivo, subsistemaClave).then((def) => {
            if (!cancel) {
                setCapacidades(def?.capacidades ?? def?.reglas ?? null);
            }
        });
        return () => {
            cancel = true;
        };
    }, [tipoEfectivo, subsistemaClave]);

    const bloqueos = useMemo(() => {
        const errs = [];
        if (!Number.isFinite(alumnoIni) || alumnoIni <= 0) {
            errs.push('Seleccione un alumno desde Expediente 360 o desde Trayectoria para iniciar una solicitud válida.');
        }
        if (!resumen?.refs?.matricula_id) errs.push('Debe registrarse primero una matrícula única institucional.');
        if (!(resumen?.materias_cursadas ?? []).length) errs.push('No hay materias cursadas registradas.');
        if (!subsistemaClave) errs.push('No fue posible determinar el subsistema académico del alumno.');
        if (!tipoEfectivo) errs.push('Seleccione un tipo documental del catálogo autorizado.');
        if (tipoEfectivo && tiposCatalogo.length && !tiposCatalogo.some((t) => t.key === tipoEfectivo)) {
            errs.push('Este tipo documental no está disponible para el subsistema seleccionado.');
        }
        if (resumen?.contexto_legacy_normativo?.requiere_atencion) {
            errs.push(
                `Importación/certificación pendiente de validaciones normativas (legacy): ${resumen.contexto_legacy_normativo.mensaje_operativo ?? 'Regularice ante Educación Superior.'}`,
            );
        }
        const adv = [];
        if (!(resumen?.trayectoria ?? null)) {
            adv.push('No existe trayectoria consolidada — valide evidencias antes de enviar a revisión institucional.');
        }
        return { errs, adv };
    }, [resumen, alumnoIni, subsistemaClave, tipoEfectivo, tiposCatalogo]);

    const puedeCrear = bloqueos.errs.length === 0;
    const motivoBloqueo = bloqueos.errs[0] ?? '';
    const esDuplicado = mensajeErrorDuplicado(error);

    async function iniciarSolicitud() {
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
                tipo_documento: tipoEfectivo,
                tipo_certificacion: tipoCert === 'termino' ? 'total' : 'parcial',
            });
            const id = py?.data?.id;
            setMsg(`Solicitud documental iniciada (${labelTipoDocumento(tipoEfectivo)}). Continúe la captura institucional.`);
            if (id) navigate(`/app/documentos/${id}/captura`);
        } catch (e) {
            const det = e?.payload?.errors ?? e?.errors;
            if (det && typeof det === 'object') {
                const flat = Object.values(det).flat().join(' ');
                setError(flat || e?.message || 'No se inició la solicitud.');
            } else {
                setError(e?.message ?? 'No se inició la solicitud. Revise observaciones institucionales.');
            }
        } finally {
            setBusy(false);
        }
    }

    const tablaMaterias = useMemo(() => resumen?.materias_cursadas ?? [], [resumen]);
    const checklist = [
        { label: 'Alumno seleccionado', ok: Number.isFinite(alumnoIni) && alumnoIni > 0 },
        { label: 'Matrícula activa', ok: Boolean(resumen?.refs?.matricula_id) },
        { label: 'Subsistema identificado', ok: Boolean(subsistemaClave) },
        { label: 'Plan reconocido', ok: Boolean(resumen?.matricula?.plan_estudios) },
        { label: 'Materias registradas', ok: (resumen?.materias_cursadas ?? []).length > 0 },
        { label: 'Trayectoria consolidada', ok: Boolean(resumen?.trayectoria) },
        { label: 'Sin bloqueos normativos', ok: !Boolean(resumen?.contexto_legacy_normativo?.requiere_atencion) },
    ];

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Solicitud documental (Control Escolar)"
                subtitle="Inicio de solicitud con tipos autorizados por subsistema — sin folio, firma ni procesamiento técnico."
                actions={
                    alumnoIni > 0 ? (
                        <Link className="inst-btn inst-btn-secondary text-sm" to={`/app/alumnos/${alumnoIni}/expediente`}>
                            Volver expediente 360°
                        </Link>
                    ) : null
                }
            />

            <AlertBox type="info" message={AVISO_CE} />

            {!Number.isFinite(alumnoIni) || alumnoIni <= 0 ? (
                <AlertBox type="danger" message="Seleccione un alumno desde Expediente 360 o desde Trayectoria para iniciar una solicitud válida." />
            ) : null}

            <p className="subtle-help-text" style={{ margin: 0 }}>{AYUDA_TIPO}</p>

            {catalogoFallback ? (
                <AlertBox
                    type="info"
                    message="Catálogo cargado desde configuración local. El endpoint institucional no respondió; las reglas siguen siendo válidas."
                />
            ) : null}

            <ValidationSummary ok={bloqueos.errs.length === 0} errores={bloqueos.errs} advertencias={bloqueos.adv} />

            <SectionCard title="Tipo documental autorizado (solo lectura)">
                <div className="grid gap-3 text-sm">
                    <label className="grid gap-1">
                        <span className="font-medium">Tipo documental</span>
                        <select
                            className="inst-select"
                            value={tipoDocumento}
                            onChange={(e) => setTipoDocumento(e.target.value)}
                            disabled={!tiposCatalogo.length}
                        >
                            <option value="">Seleccione…</option>
                            {tiposCatalogo.map((t) => (
                                <option key={t.key} value={t.key}>
                                    {t.label ?? labelTipoDocumento(t.key)}
                                </option>
                            ))}
                        </select>
                    </label>
                    {!tiposCatalogo.length && subsistemaClave ? (
                        <p className="text-amber-700 text-xs">No hay tipos documentales autorizados para este subsistema.</p>
                    ) : null}
                </div>
            </SectionCard>

            <SectionCard title="Alcance de la certificación escolar">
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

            <SectionCard title="Capacidades del tipo (informativo — no ejecutables aquí)">
                <TipoDocumentalCapacidadesCard
                    capacidades={capacidades}
                    pipelineKey={capacidades?.pipeline_key}
                    plantillaKey={capacidades?.plantilla_key_default}
                />
            </SectionCard>

            <SectionCard title="Datos para solicitud">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p><strong>Alumno:</strong> {resumen?.alumno?.nombre_completo ?? 'No seleccionado'}</p>
                    <p><strong>Matrícula:</strong> {resumen?.matricula?.clave_matricula ?? 'Sin matrícula activa'}</p>
                    <p><strong>Subsistema:</strong> {resumen?.matricula?.subsistema ?? subsistemaClave ?? 'No disponible'}</p>
                    <p><strong>Plan:</strong> {resumen?.matricula?.plan_estudios ?? 'No disponible'}</p>
                    <p><strong>Tipo documental:</strong> {labelTipoDocumento(tipoEfectivo) || '—'}</p>
                    <p><strong>Alcance:</strong> {tipoCert === 'termino' ? 'Total' : 'Parcial'}</p>
                    <p><strong>Materias incluidas:</strong> {tablaMaterias.length}</p>
                </div>
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
                titulo="Resumen cursado"
                partes={[
                    { label: 'Materias registradas', value: tablaMaterias.length, hint: 'Se validarán en etapas posteriores.' },
                    { label: 'Plan', value: resumen?.matricula?.plan_estudios ?? '—', hint: '' },
                    { label: 'Promedio (trayectoria)', value: resumen?.trayectoria?.promedio ?? '—', hint: '' },
                ]}
            />

            <SectionCard title="Historial cursado">
                <DataTable
                    columns={[
                        { key: 'clave', label: 'Asignatura' },
                        { key: 'nombre', label: 'Denominación', render: (r) => r.nombre },
                        { key: 'periodo_cursado', label: 'Periodo' },
                    ]}
                    rows={tablaMaterias}
                    emptyText="Sin materias asociadas a la matrícula."
                />
            </SectionCard>

            {error ? (
                esDuplicado ? (
                    <AlertBox
                        type="warning"
                        message="Ya existe una solicitud/documento activo para este alumno. Abra el expediente para continuar."
                    />
                ) : (
                    <ErrorState message={error} />
                )
            ) : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}

            <div className="flex flex-wrap gap-2">
                <ActionButton disabled={!puedeCrear || busy || !resumen?.refs?.matricula_id} onClick={() => void iniciarSolicitud()}>
                    {busy ? 'Iniciando solicitud…' : 'Iniciar solicitud documental'}
                </ActionButton>
            </div>
            {!puedeCrear ? <p className="text-xs text-amber-700">Acción bloqueada: {motivoBloqueo}</p> : null}
            {esDuplicado && alumnoIni > 0 ? (
                <Link className="inst-btn inst-btn-secondary text-sm" to={`/app/alumnos/${alumnoIni}/expediente`}>
                    Abrir expediente del alumno
                </Link>
            ) : null}
        </section>
    );
}
