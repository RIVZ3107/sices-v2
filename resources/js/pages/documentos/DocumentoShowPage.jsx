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
import { userCan, userCanAny } from '../../utils/userPermissions';
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
    const canLiberarProcesoTecnico = userCanAny([
        'documentos.liberar_proceso_tecnico',
        'preparar_documento_firma',
        'certificacion.enviar_a_proceso_tecnico',
    ]);
    const canGenerarCadena = userCanAny(['generar_cadena', 'cadena_original.generar']);
    const canGenerarXml = userCanAny(['generar_xml', 'xml.generar']);
    const canIrProcesoTecnico = userCan('firma.ejecutar');
    const canTokenPublico = userCanAny([
        'consulta_publica.emitir_token',
        'consulta_publica.configurar',
        'preparar_documento_firma',
        'documentos.liberar_proceso_tecnico',
    ]);

    async function refresh() {
        const [d, o] = await Promise.all([
            documentosAcademicosApi.show(id),
            observacionesApi.listar(id),
        ]);
        setDoc(d.data);
        setObs(o.data);
        setVal(d?.data?.validacion_resumen ?? null);
        try {
            const v = await documentosAcademicosApi.validar(id);
            if (v?.data?.resumen) setVal(v.data.resumen);
        } catch {
            /* resumen opcional al cargar */
        }
    }

    useEffect(() => {
        refresh().catch(() => setDoc(false));
    }, [id]);

    if (doc === null) return <LoadingState text="Cargando documento..." />;
    if (doc === false) return <ErrorState message="No se pudo cargar el documento." />;

    async function runAction(action) {
        if (runningAction) return;

        setRunningAction(action);
        setError('');
        setMsg('');
        try {
            if (action === 'enviar') await documentosAcademicosApi.enviarRevision(id, { motivo: 'Enviado desde frontend.' });
            if (action === 'aprobar') await documentosAcademicosApi.aprobar(id, { motivo: 'Aprobacion desde frontend.' });
            if (action === 'rechazar') await documentosAcademicosApi.rechazar(id, { motivo: 'Rechazo desde frontend.' });
            if (action === 'preparar') await documentosAcademicosApi.marcarListoParaFirma(id, { motivo: 'Liberar a proceso técnico.' });
            if (action === 'token') await documentosAcademicosApi.emitirTokenConsulta(id, {});
            if (action === 'validar') {
                const res = await documentosAcademicosApi.validar(id);
                setVal(res?.data?.resumen ?? null);
            }
            await refresh();
            setMsg('Operacion ejecutada correctamente.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo ejecutar la acción. Intenta nuevamente.');
        } finally {
            setRunningAction(null);
        }
    }

    const timelineSteps = [
        { key: 'borrador', label: 'Borrador', done: ['borrador', 'en_revision', 'aprobado', 'rechazado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'en_revision', label: 'En revision', done: ['en_revision', 'aprobado', 'rechazado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'rechazado', label: 'Devuelto', done: doc.estado_workflow === 'rechazado' },
        { key: 'aprobado', label: 'Aprobado', done: ['aprobado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'listo_para_firma', label: 'Proceso técnico', done: doc.listo_para_firma },
        { key: 'firmado', label: 'Firmado', done: doc.estado_firma === 'firmado' },
    ];

    const actionBusy = Boolean(runningAction);

    return (
        <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <PageHeader
                title={`Documento #${doc.id}`}
                subtitle="Detalle documental según permisos del usuario."
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/captura`)}>Captura</ActionButton>
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/observaciones`)}>Observaciones</ActionButton>
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/validacion`)}>Validacion</ActionButton>
                    </div>
                )}
            />
            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}
            <div className="grid gap-4">
                <SectionCard title="Encabezado documental" subtitle="Estado actual del flujo de certificación y datos principales.">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Folio: {doc.folio_interno ?? `Doc #${doc.id}`}</h2>
                        <EstadoBadge estado={doc.estado_workflow} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Alumno: {doc.alumno?.nombre ?? 'N/A'} | CURP: {doc.alumno?.curp ?? '-'}</p>
                    <p className="mt-1 text-sm text-slate-600">Matricula ID: {doc.matricula_id ?? '-'} | Institucion/Sede: {doc.institucion_id ?? '-'} / {doc.sede_id ?? '-'}</p>
                    <p className="mt-1 text-sm text-slate-600">Tipo documento: {doc.tipo_documento ?? '-'} | Estado firma: {doc.estado_firma ?? '-'}</p>
                </SectionCard>
                <SectionCard title="Timeline del proceso de certificación">
                    <Timeline steps={timelineSteps} current={doc.estado_workflow} />
                </SectionCard>
                <ValidacionResumenCard resumen={val} />
                <EstadoSepLegacyPanel
                    alumnoId={doc.alumno_id ?? doc.alumno?.id}
                    documentoId={doc.id}
                    curp={doc.alumno?.curp}
                />
                <ObservacionesPanel items={obs} />
                <SectionCard title="Secciones de documento">
                    <p>Materias, trayectoria y detalles extendidos dependen de endpoints de consulta detallada backend.</p>
                    <Link to="/app/documentos/bandejas" className="mt-2 inline-block text-blue-700 hover:underline">Volver a bandejas</Link>
                </SectionCard>
            </div>
            <aside className="inst-surface grid h-max gap-3 p-4">
                <h3 className="inst-title text-sm">Acciones disponibles</h3>
                <ActionButton variant="secondary" disabled={actionBusy} onClick={() => runAction('validar')}>Ver validación</ActionButton>
                {canEnviar ? <ActionButton disabled={actionBusy} onClick={() => runAction('enviar')}>Enviar a revision</ActionButton> : null}
                {canRechazar ? <ActionButton variant="danger" disabled={actionBusy} onClick={() => runAction('rechazar')}>Rechazar / devolver</ActionButton> : null}
                {canAprobar ? <ActionButton disabled={actionBusy} onClick={() => runAction('aprobar')}>Aprobar</ActionButton> : null}
                {canLiberarProcesoTecnico ? (
                    <ActionButton variant="warning" disabled={actionBusy} onClick={() => runAction('preparar')}>
                        Liberar a proceso técnico
                    </ActionButton>
                ) : null}
                {canTokenPublico ? <ActionButton variant="secondary" disabled={actionBusy} onClick={() => runAction('token')}>Emitir token consulta pública</ActionButton> : null}
                {canGenerarCadena ? <p className="inst-muted text-xs">Cadena/XML: usar panel técnico Sistemas o API.</p> : null}
                {canGenerarXml ? null : null}
                {canIrProcesoTecnico ? (
                    <ActionButton
                        variant="warning"
                        onClick={() => navigate(`/app/sistemas/proceso-tecnico-certificacion/${id}`)}
                    >
                        Ir a proceso técnico
                    </ActionButton>
                ) : null}
            </aside>
        </section>
    );
}
