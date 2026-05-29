import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { observacionesApi } from '../../api/observaciones';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { EstadoBadge } from '../../components/EstadoBadge';
import { LoadingState } from '../../components/LoadingState';
import { ObservacionesPanel } from '../../components/ObservacionesPanel';
import { PageHeader } from '../../components/PageHeader';
import { ValidacionResumenCard } from '../../components/ValidacionResumenCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { Timeline } from '../../components/ui/Timeline';
import { AlertBox } from '../../components/ui/AlertBox';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { userCanAny } from '../../utils/userPermissions';
import {
    uxCanVerDetalleTecnico,
    uxEsControlEscolarOperativo,
    uxLinkIncidenciaTecnica,
    uxPuedeAsignarFolioOficial,
    uxPuedeEmitirConsultaPublica,
    uxPuedeProcesarCertificacion,
} from '../../utils/uxInstitucional';
import { EstadoSepLegacyPanel } from '../expedientes/components/EstadoSepLegacyPanel';

export function DocumentoShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doc, setDoc] = useState(null);
    const [obs, setObs] = useState([]);
    const [val, setVal] = useState(null);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [runningAction, setRunningAction] = useState(null);
    const [intentadoAccion, setIntentadoAccion] = useState(false);

    const esCe = uxEsControlEscolarOperativo();
    const verTecnico = uxCanVerDetalleTecnico();

    const canEnviar = userCanAny(['enviar_revision', 'documentos.enviar_revision']);
    const canAprobar = userCanAny([
        'aprobar_documentos',
        'documentos.aprobar',
        'documentos.aprobar_institucionalmente',
        'validaciones_normativas.aprobar',
        'certificacion.autorizar_emision',
        'certificacion.validar',
    ]);
    const canRechazar = userCanAny([
        'rechazar_documentos',
        'documentos.rechazar',
        'documentos.rechazar_institucionalmente',
        'validaciones_normativas.rechazar',
    ]);
    const canProcesar = uxPuedeProcesarCertificacion() && !esCe;
    const canTokenPublico = uxPuedeEmitirConsultaPublica() && !esCe;
    const canVerIncidencia = userCanAny(['certificacion.enviar_incidencia_sistemas', 'logs.ver', 'integraciones.ver']);

    async function refresh() {
        const [d, o] = await Promise.all([
            documentosAcademicosApi.show(id),
            observacionesApi.listar(id),
        ]);
        setDoc(d.data);
        setObs(o.data);
        setVal(d?.data?.validacion_resumen ?? null);
    }

    useEffect(() => {
        refresh().catch(() => setDoc(false));
    }, [id]);

    if (doc === null) return <LoadingState text="Cargando documento…" />;
    if (doc === false) return <ErrorState message="No se pudo cargar el documento." />;

    async function runAction(action) {
        if (runningAction) return;
        setIntentadoAccion(true);
        setRunningAction(action);
        setError('');
        setMsg('');
        try {
            if (action === 'enviar') {
                await documentosAcademicosApi.enviarRevision(id, { motivo: 'Enviado a revisión del certificador.' });
            }
            if (action === 'aprobar') {
                await documentosAcademicosApi.aprobar(id, { motivo: 'Aprobación institucional.' });
            }
            if (action === 'rechazar') {
                await documentosAcademicosApi.rechazar(id, { motivo: 'Devolución con observaciones.' });
            }
            if (action === 'preparar') {
                await documentosAcademicosApi.marcarListoParaFirma(id, {
                    motivo: 'Inicio de procesamiento de certificación.',
                });
            }
            if (action === 'token') {
                await documentosAcademicosApi.emitirTokenConsulta(id, {});
            }
            if (action === 'validar') {
                const res = await documentosAcademicosApi.validar(id);
                setVal(res?.data?.resumen ?? null);
            }
            await refresh();
            setMsg('Operación registrada correctamente.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo completar la acción.');
        } finally {
            setRunningAction(null);
        }
    }

    const timelineSteps = [
        { key: 'borrador', label: 'Captura', done: ['borrador', 'en_revision', 'aprobado', 'rechazado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'en_revision', label: 'En revisión', done: ['en_revision', 'aprobado', 'rechazado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'rechazado', label: 'Observado', done: doc.estado_workflow === 'rechazado' },
        { key: 'aprobado', label: 'Aprobado', done: ['aprobado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'listo_para_firma', label: 'En procesamiento', done: doc.listo_para_firma },
        { key: 'firmado', label: 'Resultado final', done: doc.estado_firma === 'firmado' },
    ];

    const actionBusy = Boolean(runningAction);
    const tituloDoc = doc.folio_interno ? `Documento ${doc.folio_interno}` : `Solicitud documental #${doc.id}`;

    return (
        <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <PageHeader
                title={tituloDoc}
                subtitle={esCe ? 'Seguimiento de su solicitud' : 'Detalle del documento académico'}
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/captura`)}>
                            {esCe ? 'Completar captura' : 'Captura'}
                        </ActionButton>
                        {!esCe ? (
                            <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/observaciones`)}>
                                Observaciones
                            </ActionButton>
                        ) : null}
                    </div>
                )}
            />

            <InstitutionalRoleBanner />

            {intentadoAccion && error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}

            <div className="grid gap-4">
                <SectionCard title="Resumen" subtitle="Información principal del documento.">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-base font-semibold">{doc.alumno?.nombre ?? 'Alumno'}</h2>
                        <EstadoBadge estado={doc.estado_workflow} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">CURP: {doc.alumno?.curp ?? '—'}</p>
                    <p className="mt-1 text-sm text-slate-600">Tipo: {doc.tipo_documento ?? '—'}</p>
                    {verTecnico ? (
                        <p className="mt-1 text-sm text-slate-500">
                            Referencia interna: matrícula {doc.matricula_id ?? '—'} · institución {doc.institucion_id ?? '—'}
                        </p>
                    ) : null}
                </SectionCard>

                <SectionCard title="Avance del trámite">
                    <Timeline steps={timelineSteps} current={doc.estado_workflow} />
                </SectionCard>

                {!esCe ? <ValidacionResumenCard resumen={val} /> : null}

                {verTecnico ? (
                    <EstadoSepLegacyPanel
                        alumnoId={doc.alumno_id ?? doc.alumno?.id}
                        documentoId={doc.id}
                        curp={doc.alumno?.curp}
                    />
                ) : null}

                <ObservacionesPanel items={obs} />

                <Link to="/app/documentos/bandejas" className="text-sm text-blue-700 hover:underline">
                    Volver a bandejas
                </Link>
            </div>

            <aside className="inst-surface grid h-max gap-3 p-4">
                <h3 className="inst-title text-sm">Acciones</h3>

                {esCe ? (
                    <>
                        <ActionButton disabled={actionBusy} onClick={() => runAction('validar')}>
                            Ver validaciones
                        </ActionButton>
                        {canEnviar ? (
                            <ActionButton disabled={actionBusy} onClick={() => runAction('enviar')}>
                                Enviar a validación
                            </ActionButton>
                        ) : null}
                        <p className="inst-muted text-xs">
                            No puede procesar, firmar ni asignar folio desde Control Escolar.
                        </p>
                    </>
                ) : (
                    <>
                        <ActionButton variant="secondary" disabled={actionBusy} onClick={() => runAction('validar')}>
                            Validar información
                        </ActionButton>
                        {canEnviar ? (
                            <ActionButton disabled={actionBusy} onClick={() => runAction('enviar')}>
                                Enviar a revisión
                            </ActionButton>
                        ) : null}
                        {canRechazar ? (
                            <ActionButton variant="danger" disabled={actionBusy} onClick={() => runAction('rechazar')}>
                                Devolver con observaciones
                            </ActionButton>
                        ) : null}
                        {canAprobar ? (
                            <ActionButton disabled={actionBusy} onClick={() => runAction('aprobar')}>
                                Aprobar
                            </ActionButton>
                        ) : null}
                        {canProcesar ? (
                            <ActionButton variant="warning" disabled={actionBusy} onClick={() => runAction('preparar')}>
                                Procesar certificación
                            </ActionButton>
                        ) : null}
                        {canTokenPublico && uxPuedeAsignarFolioOficial() ? (
                            <ActionButton variant="secondary" disabled={actionBusy} onClick={() => runAction('token')}>
                                Consulta pública
                            </ActionButton>
                        ) : null}
                        {canVerIncidencia && doc.estado_firma === 'error_firma' ? (
                            <ActionButton
                                variant="secondary"
                                onClick={() => navigate(uxLinkIncidenciaTecnica(id))}
                            >
                                Incidencia técnica
                            </ActionButton>
                        ) : null}
                    </>
                )}
            </aside>
        </section>
    );
}
