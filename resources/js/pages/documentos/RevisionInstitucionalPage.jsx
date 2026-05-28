import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { observacionesApi } from '../../api/observaciones';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { EstadoBadge } from '../../components/EstadoBadge';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { ValidationSummary } from '../../components/academic/ValidationSummary';
import { AlertBox } from '../../components/ui/AlertBox';
import { DataTable } from '../../components/ui/DataTable';
import { SectionCard } from '../../components/ui/SectionCard';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { EstadoSepLegacyPanel } from '../expedientes/components/EstadoSepLegacyPanel';
import { canRevision, REV_PERM } from '../../utils/revisionInstitucionalPermissions';
import { revisionInstitucionalBasePath } from '../../utils/certificacionRoutes';

const SECCION_TIPO = {
    alumno: 'datos_alumno',
    matricula: 'institucion',
    materias: 'materias',
    trayectoria: 'trayectoria',
    documento: 'documental',
    otro: 'academica',
};

export function RevisionInstitucionalPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [showObs, setShowObs] = useState(false);
    const [obsForm, setObsForm] = useState({
        seccion: 'documento',
        prioridad: 'media',
        observacion: '',
        requiere_correccion: true,
    });
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const cargar = useCallback(async () => {
        setError('');
        try {
            const res = await documentosAcademicosApi.revisionInstitucional(id);
            setData(res?.data ?? null);
        } catch (e) {
            setData(false);
            setError(e?.message ?? 'No se pudo cargar el documento.');
        }
    }, [id]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const doc = data?.documento;
    const validacion = data?.validacion;
    const obsPendientes = doc?.observaciones_pendientes_count ?? 0;
    const puedeOperar = doc?.puede_operar_revision !== false;

    const bloqueosAprobar = useMemo(() => {
        const errs = [];
        if (!validacion?.valido) {
            errs.push('La validación académica no está completa.');
            (validacion?.errores ?? []).forEach((e) => errs.push(String(e)));
        }
        if (obsPendientes > 0) {
            errs.push('Hay observaciones pendientes de atención por Control Escolar.');
        }
        if (!['en_revision', 'pendiente', 'borrador'].includes(doc?.estado_workflow ?? '')) {
            if (doc?.estado_workflow === 'aprobado') {
                errs.push('El documento ya está aprobado institucionalmente.');
            } else if (doc?.estado_workflow === 'rechazado') {
                errs.push('El documento está devuelto; atienda observaciones antes de aprobar.');
            }
        }
        return errs;
    }, [validacion, obsPendientes, doc]);

    const bloqueosLiberar = useMemo(() => {
        const errs = [];
        if (doc?.estado_workflow !== 'aprobado') {
            errs.push('Debe aprobar el documento antes de liberar a proceso técnico.');
        }
        if (!validacion?.valido) {
            errs.push('La validación académica tiene errores críticos.');
            (validacion?.errores ?? []).forEach((e) => errs.push(String(e)));
        }
        if (obsPendientes > 0) {
            errs.push('No se puede liberar con observaciones pendientes.');
        }
        if (doc?.listo_para_firma) {
            errs.push('El documento ya está listo para proceso técnico.');
        }
        if (['firmado', 'cancelado'].includes(doc?.estado_firma ?? '')) {
            errs.push('El documento ya fue firmado o está cancelado.');
        }
        return errs;
    }, [doc, obsPendientes, validacion]);

    async function ejecutar(accion, payload = {}) {
        setBusy(true);
        setError('');
        setMsg('');
        try {
            if (accion === 'validar') {
                await documentosAcademicosApi.validar(id);
                setMsg('Validación actualizada.');
            }
            if (accion === 'aprobar') {
                await documentosAcademicosApi.aprobar(id, { motivo: payload.motivo ?? 'Aprobación institucional.' });
                setMsg('Documento aprobado institucionalmente.');
            }
            if (accion === 'rechazar') {
                await documentosAcademicosApi.rechazar(id, { motivo: payload.motivo });
                setMsg('Documento rechazado.');
            }
            if (accion === 'devolver') {
                await observacionesApi.devolver(id, { motivo: payload.motivo });
                setMsg('Documento devuelto a corrección. Control Escolar debe atender observaciones.');
            }
            if (accion === 'folio') {
                await documentosAcademicosApi.asignarFolioInterno(id, {});
                setMsg('Folio interno asignado.');
            }
            if (accion === 'liberar') {
                await documentosAcademicosApi.marcarListoParaFirma(id, { motivo: 'Liberado a proceso técnico.' });
                setMsg('Documento liberado a proceso técnico (Sistemas).');
            }
            if (accion === 'observacion') {
                await observacionesApi.crear(id, {
                    tipo: SECCION_TIPO[payload.seccion] ?? 'academica',
                    seccion: payload.seccion,
                    observacion: payload.observacion,
                    prioridad: payload.prioridad,
                    metadata: { requiere_correccion: payload.requiere_correccion },
                });
                setShowObs(false);
                setMsg('Observación registrada.');
            }
            await cargar();
        } catch (e) {
            const det = e?.payload?.errors ?? e?.errors;
            if (det && typeof det === 'object') {
                setError(Object.values(det).flat().join(' '));
            } else {
                setError(e?.message ?? 'Error en la operación.');
            }
        } finally {
            setBusy(false);
        }
    }

    if (data === null) return <LoadingState text="Cargando revisión institucional…" />;
    if (data === false) return <ErrorState message={error || 'Documento no disponible.'} />;

    const materiasRows = (data.materias_cursadas ?? []).map((m) => ({
        clave: m.clave,
        nombre: m.nombre,
        calificacion: m.calificacion ?? m.calificacion_texto ?? '—',
        periodo: m.periodo_cursado ?? m.periodo ?? '—',
        semestre: m.semestre ?? m.periodo_curricular_etiqueta ?? '—',
    }));

    return (
        <RequirePermission anyOf={REV_PERM.ver}>
            <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
                <div className="grid gap-4">
                    <PageHeader
                        title={`Revisión institucional #${doc?.id}`}
                        subtitle={`${data.alumno?.nombre_completo ?? ''} · ${data.alumno?.curp ?? ''}`}
                        actions={(
                            <Link to={revisionInstitucionalBasePath()} className="inst-btn inst-btn-secondary text-sm">
                                Volver a bandeja
                            </Link>
                        )}
                    />

                    {obsPendientes > 0 ? (
                        <AlertBox
                            type="warning"
                            message={`Hay ${obsPendientes} observación(es) pendiente(s). Control Escolar debe atenderlas antes de aprobar o liberar.`}
                        />
                    ) : null}

                    <SectionCard title="Documento solicitado">
                        <div className="flex flex-wrap items-center gap-3">
                            <EstadoBadge estado={doc?.estado_workflow} />
                            <span className="text-sm">Firma: {doc?.estado_firma ?? 'no_firmado'}</span>
                            {doc?.listo_para_firma ? <span className="inst-badge inst-badge-success">Listo proceso técnico</span> : null}
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                            Folio: {doc?.folio_interno ?? 'Sin asignar'} · Tipo: {doc?.tipo_documento} ({doc?.tipo_certificacion})
                        </p>
                        <p className="text-sm text-slate-600">
                            Envío a revisión:{' '}
                            {doc?.fecha_solicitud ? new Date(doc.fecha_solicitud).toLocaleString('es-MX') : '—'}
                        </p>
                    </SectionCard>

                    <SectionCard title="Datos del alumno">
                        <p className="text-sm"><strong>Nombre:</strong> {data.alumno?.nombre_completo}</p>
                        <p className="text-sm"><strong>CURP:</strong> {data.alumno?.curp}</p>
                    </SectionCard>

                    <SectionCard title="Matrícula e institución">
                        <p className="text-sm"><strong>Matrícula:</strong> {data.matricula?.matricula ?? data.matricula?.clave_matricula ?? '—'}</p>
                        <p className="text-sm"><strong>Institución:</strong> {data.institucion?.nombre}</p>
                        <p className="text-sm"><strong>Sede / CCT:</strong> {data.sede?.clave ?? data.sede?.nombre}</p>
                        <p className="text-sm"><strong>Programa:</strong> {data.programa?.nombre ?? data.programa ?? '—'}</p>
                        <p className="text-sm"><strong>Plan:</strong> {data.plan?.nombre ?? data.plan ?? '—'}</p>
                        <p className="text-sm"><strong>Ciclo:</strong> {data.ciclo_escolar?.nombre ?? '—'}</p>
                    </SectionCard>

                    <SectionCard title="Materias cursadas">
                        <DataTable
                            columns={[
                                { key: 'clave', label: 'Clave' },
                                { key: 'nombre', label: 'Materia' },
                                { key: 'calificacion', label: 'Calificación' },
                                { key: 'periodo', label: 'Periodo' },
                                { key: 'semestre', label: 'Semestre' },
                            ]}
                            rows={materiasRows}
                            emptyText="Sin materias registradas."
                        />
                    </SectionCard>

                    <SectionCard title="Trayectoria académica">
                        {data.trayectoria ? (
                            <ul className="text-sm grid gap-1">
                                <li>Promedio: {data.trayectoria.promedio ?? data.trayectoria.promedio_aprovechamiento ?? '—'}</li>
                                <li>Créditos: {data.trayectoria.creditos_obtenidos ?? data.trayectoria.creditos_acumulados ?? '—'}</li>
                                <li>Materias acreditadas: {data.trayectoria.materias_acreditadas ?? '—'}</li>
                            </ul>
                        ) : (
                            <p className="text-sm text-amber-700">Sin trayectoria consolidada.</p>
                        )}
                    </SectionCard>

                    <SectionCard title="Observaciones institucionales">
                        <ul className="grid gap-2 text-sm max-h-48 overflow-y-auto">
                            {(data.observaciones ?? []).map((o) => (
                                <li key={o.id} className="border-b border-slate-100 pb-2">
                                    <span className="font-medium">{o.seccion ?? o.tipo}</span>
                                    <span className={`ml-2 text-xs ${o.estado === 'pendiente' ? 'text-amber-700' : 'text-slate-500'}`}>
                                        {o.estado} · {o.prioridad}
                                    </span>
                                    <p className="text-slate-700">{o.observacion}</p>
                                </li>
                            ))}
                        </ul>
                        {(data.observaciones ?? []).length === 0 ? <p className="text-sm text-slate-500">Sin observaciones.</p> : null}
                    </SectionCard>

                    <ValidationSummary
                        ok={Boolean(validacion?.valido)}
                        errores={validacion?.errores ?? []}
                        advertencias={validacion?.resumen?.advertencias ?? []}
                    />

                    <EstadoSepLegacyPanel
                        alumnoId={data.alumno?.id}
                        documentoId={doc?.id}
                        curp={data.alumno?.curp}
                    />

                    {error ? <ErrorState message={error} /> : null}
                    {msg ? <AlertBox type="success" message={msg} /> : null}

                    {showObs ? (
                        <SectionCard title="Nueva observación">
                            <div className="grid gap-3 text-sm">
                                <label className="grid gap-1">
                                    Sección
                                    <select
                                        className="inst-select"
                                        value={obsForm.seccion}
                                        onChange={(e) => setObsForm((s) => ({ ...s, seccion: e.target.value }))}
                                    >
                                        <option value="alumno">Alumno</option>
                                        <option value="matricula">Matrícula</option>
                                        <option value="materias">Materias</option>
                                        <option value="trayectoria">Trayectoria</option>
                                        <option value="documento">Documento</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </label>
                                <label className="grid gap-1">
                                    Prioridad
                                    <select
                                        className="inst-select"
                                        value={obsForm.prioridad}
                                        onChange={(e) => setObsForm((s) => ({ ...s, prioridad: e.target.value }))}
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                    </select>
                                </label>
                                <label className="grid gap-1">
                                    Observación
                                    <textarea
                                        className="inst-input min-h-[80px]"
                                        value={obsForm.observacion}
                                        onChange={(e) => setObsForm((s) => ({ ...s, observacion: e.target.value }))}
                                    />
                                </label>
                                <label className="flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        checked={obsForm.requiere_correccion}
                                        onChange={(e) => setObsForm((s) => ({ ...s, requiere_correccion: e.target.checked }))}
                                    />
                                    Requiere corrección por Control Escolar
                                </label>
                                <div className="flex gap-2">
                                    <ActionButton
                                        disabled={busy || !obsForm.observacion.trim()}
                                        onClick={() => void ejecutar('observacion', obsForm)}
                                    >
                                        Guardar observación
                                    </ActionButton>
                                    <ActionButton variant="secondary" onClick={() => setShowObs(false)}>
                                        Cancelar
                                    </ActionButton>
                                </div>
                            </div>
                        </SectionCard>
                    ) : null}
                </div>

                <aside className="inst-surface grid h-max gap-3 p-4">
                    <h3 className="inst-title text-sm">Acciones de revisión</h3>
                    {!puedeOperar ? (
                        <p className="text-xs text-slate-500">Documento en estado de solo consulta.</p>
                    ) : null}

                    {canRevision('validar') ? (
                        <ActionButton variant="secondary" disabled={busy} onClick={() => void ejecutar('validar')}>
                            Validar expediente
                        </ActionButton>
                    ) : null}

                    {canRevision('observar') ? (
                        <>
                            <ActionButton variant="secondary" disabled={busy || !puedeOperar} onClick={() => setShowObs(true)}>
                                Crear observación
                            </ActionButton>
                            <ActionButton
                                variant="warning"
                                disabled={busy || !puedeOperar || obsPendientes < 1}
                                onClick={() => {
                                    const m = window.prompt('Motivo de devolución a corrección:', 'Atender observaciones institucionales.');
                                    if (m) void ejecutar('devolver', { motivo: m });
                                }}
                            >
                                Devolver a corrección
                            </ActionButton>
                            {obsPendientes < 1 ? (
                                <p className="text-xs text-amber-700">Registre al menos una observación pendiente antes de devolver.</p>
                            ) : null}
                        </>
                    ) : null}

                    {canRevision('aprobar') ? (
                        <ActionButton
                            disabled={busy || !puedeOperar || bloqueosAprobar.length > 0}
                            onClick={() => {
                                if (!window.confirm('¿Confirma la aprobación institucional de este documento?')) return;
                                void ejecutar('aprobar', { motivo: 'Aprobación institucional confirmada.' });
                            }}
                        >
                            Aprobar
                        </ActionButton>
                    ) : null}

                    {canRevision('rechazar') ? (
                        <>
                            <textarea
                                className="inst-input text-xs min-h-[60px]"
                                placeholder="Motivo de rechazo (obligatorio)"
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                            />
                            <ActionButton
                                variant="danger"
                                disabled={busy || !puedeOperar || !motivoRechazo.trim()}
                                onClick={() => void ejecutar('rechazar', { motivo: motivoRechazo })}
                            >
                                Rechazar
                            </ActionButton>
                        </>
                    ) : null}

                    {canRevision('folio') ? (
                        <ActionButton
                            variant="secondary"
                            disabled={busy || doc?.estado_workflow !== 'aprobado'}
                            onClick={() => void ejecutar('folio')}
                        >
                            Asignar folio interno
                        </ActionButton>
                    ) : null}

                    {canRevision('liberar') ? (
                        <ActionButton
                            variant="warning"
                            disabled={busy || bloqueosLiberar.length > 0}
                            onClick={() => {
                                if (!window.confirm('¿Liberar documento a proceso técnico (Sistemas)?')) return;
                                void ejecutar('liberar');
                            }}
                        >
                            Liberar a proceso técnico
                        </ActionButton>
                    ) : null}

                    {bloqueosLiberar.length > 0 && canRevision('liberar') ? (
                        <p className="text-xs text-amber-700">{bloqueosLiberar.join(' ')}</p>
                    ) : null}

                    <p className="text-xs text-slate-400 mt-2 border-t pt-2">
                        Cadena, XML y firma SEP solo están disponibles para el rol Sistemas.
                    </p>
                </aside>
            </section>
        </RequirePermission>
    );
}
