import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { observacionesApi } from '../../api/observaciones';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { EsHeaderAction, EsPageLayout } from '../../components/educacionSuperior';
import { UpnCertificadoSummaryCard, UpnCertificateDetailSections } from '../../components/upn';
import { upnCan, upnCanProcesoTecnico, UPN_PERM } from '../../utils/upnCertificacionPermissions';

const SECCION_TIPO = {
    alumno: 'datos_alumno',
    matricula: 'institucion',
    materias: 'materias',
    trayectoria: 'trayectoria',
    documento: 'documental',
    otro: 'academica',
};

export function UpnCertificadoDetallePage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [docShow, setDocShow] = useState(null);
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
            const [rev, show] = await Promise.all([
                documentosAcademicosApi.revisionInstitucional(id),
                documentosAcademicosApi.show(id).catch(() => ({ data: null })),
            ]);
            setData(rev?.data ?? null);
            setDocShow(show?.data ?? null);
        } catch (e) {
            setData(false);
            setError(e?.message ?? 'No se pudo cargar el certificado.');
        }
    }, [id]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const doc = data?.documento;
    const validacion = data?.validacion;
    const obsPendientes = doc?.observaciones_pendientes_count ?? 0;

    const bloqueosAprobar = useMemo(() => {
        const errs = [];
        if (!validacion?.valido) errs.push('Validación académica incompleta.');
        if (obsPendientes > 0) errs.push('Hay observaciones pendientes.');
        if (!['en_revision', 'pendiente', 'borrador'].includes(doc?.estado_workflow ?? '')) {
            if (doc?.estado_workflow === 'aprobado') errs.push('Ya está aprobado.');
        }
        return errs;
    }, [validacion, obsPendientes, doc]);

    const bloqueosLiberar = useMemo(() => {
        const errs = [];
        if (doc?.estado_workflow !== 'aprobado') errs.push('Debe aprobar antes de liberar.');
        if (obsPendientes > 0) errs.push('Observaciones pendientes.');
        if (doc?.listo_para_firma) errs.push('Ya liberado a proceso técnico.');
        return errs;
    }, [doc, obsPendientes]);

    async function ejecutar(accion, payload = {}) {
        setBusy(true);
        setError('');
        setMsg('');
        try {
            if (accion === 'validar') await documentosAcademicosApi.validar(id);
            if (accion === 'aprobar') {
                await documentosAcademicosApi.aprobar(id, { motivo: payload.motivo ?? 'Aprobación UPN.' });
            }
            if (accion === 'rechazar') {
                await documentosAcademicosApi.rechazar(id, { motivo: payload.motivo });
            }
            if (accion === 'devolver') {
                await observacionesApi.devolver(id, { motivo: payload.motivo });
            }
            if (accion === 'folio') {
                const folio = window.prompt('Folio interno:', doc?.folio_interno ?? '');
                if (folio === null || !folio.trim()) return;
                await documentosAcademicosApi.asignarFolioInterno(id, { folio_interno: folio.trim() });
            }
            if (accion === 'liberar') {
                await documentosAcademicosApi.marcarListoParaFirma(id, {
                    motivo: 'Liberado a proceso técnico UPN.',
                });
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
            }
            setMsg('Operación registrada.');
            await cargar();
        } catch (e) {
            setError(e?.message ?? 'Error en la operación.');
        } finally {
            setBusy(false);
        }
    }

    if (data === null) {
        return <EsPageLayout loading loadingText="Cargando certificado UPN…" title="" />;
    }
    if (data === false) {
        return (
            <EsPageLayout title="Certificado UPN" error={error}>
                <ErrorState message={error || 'Certificado no disponible.'} />
            </EsPageLayout>
        );
    }

    const docMeta = {
        ...(docShow?.metadata ?? {}),
        estado_pdf: docShow?.estado_pdf,
        folio_digital_sep: docShow?.folio_digital_sep,
        url_short: docShow?.metadata?.url_short ?? docShow?.token_consulta_publica,
    };

    return (
        <RequirePermission anyOf={UPN_PERM.ver}>
            <EsPageLayout
                breadcrumbCurrent="Detalle certificado UPN"
                title={`Certificado UPN #${doc?.id}`}
                subtitle="Revisión institucional de certificado de profesionista"
                actions={
                    <EsHeaderAction
                        to="/app/educacion-superior/upn/certificacion"
                        label="Volver a bandeja UPN"
                        variant="secondary"
                    />
                }
            >
                <UpnCertificadoSummaryCard
                    doc={{ ...doc, ...docShow }}
                    alumno={data.alumno}
                    sede={data.sede}
                    programa={data.programa}
                />

                {obsPendientes > 0 ? (
                    <AlertBox
                        type="warning"
                        message={`Hay ${obsPendientes} observación(es) pendiente(s). Control Escolar debe atenderlas.`}
                    />
                ) : null}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
                    <div>
                        <UpnCertificateDetailSections data={data} validacion={validacion} docMeta={docMeta} />

                        {showObs ? (
                            <SectionCard title="Nueva observación" id="observaciones">
                                <div className="grid gap-3 text-sm">
                                    <textarea
                                        className="inst-input min-h-[80px]"
                                        value={obsForm.observacion}
                                        onChange={(e) => setObsForm((s) => ({ ...s, observacion: e.target.value }))}
                                        placeholder="Describa la observación…"
                                    />
                                    <ActionButton
                                        disabled={busy || !obsForm.observacion.trim()}
                                        onClick={() => void ejecutar('observacion', obsForm)}
                                    >
                                        Guardar observación
                                    </ActionButton>
                                </div>
                            </SectionCard>
                        ) : null}

                        {error ? <ErrorState message={error} /> : null}
                        {msg ? <AlertBox type="success" message={msg} /> : null}
                    </div>

                    <aside
                        style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: 16,
                            display: 'grid',
                            gap: 10,
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Acciones</h3>
                        <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                            Sin cadena, XML, preflight ni firma SEP desde esta vista.
                        </p>

                        {upnCan('validar') ? (
                            <ActionButton variant="secondary" disabled={busy} onClick={() => void ejecutar('validar')}>
                                Validar expediente
                            </ActionButton>
                        ) : null}

                        {upnCan('observar') ? (
                            <ActionButton variant="secondary" disabled={busy} onClick={() => setShowObs(true)}>
                                Observar
                            </ActionButton>
                        ) : null}

                        {upnCan('devolver') ? (
                            <ActionButton
                                variant="warning"
                                disabled={busy || obsPendientes < 1}
                                onClick={() => {
                                    const m = window.prompt('Motivo de devolución:', 'Atender observaciones.');
                                    if (m) void ejecutar('devolver', { motivo: m });
                                }}
                            >
                                Devolver a corrección
                            </ActionButton>
                        ) : null}

                        {upnCan('aprobar') ? (
                            <ActionButton
                                disabled={busy || bloqueosAprobar.length > 0}
                                onClick={() => {
                                    if (!window.confirm('¿Aprobar certificado UPN?')) return;
                                    void ejecutar('aprobar');
                                }}
                            >
                                Aprobar
                            </ActionButton>
                        ) : null}

                        {upnCan('rechazar') ? (
                            <>
                                <textarea
                                    className="inst-input text-xs min-h-[50px]"
                                    placeholder="Motivo rechazo"
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                />
                                <ActionButton
                                    variant="danger"
                                    disabled={busy || !motivoRechazo.trim()}
                                    onClick={() => void ejecutar('rechazar', { motivo: motivoRechazo })}
                                >
                                    Rechazar
                                </ActionButton>
                            </>
                        ) : null}

                        {upnCan('folio') ? (
                            <ActionButton
                                variant="secondary"
                                disabled={busy || doc?.estado_workflow !== 'aprobado'}
                                onClick={() => void ejecutar('folio')}
                            >
                                Asignar folio
                            </ActionButton>
                        ) : null}

                        {upnCan('liberar') ? (
                            <ActionButton
                                variant="warning"
                                disabled={busy || bloqueosLiberar.length > 0}
                                onClick={() => {
                                    if (!window.confirm('¿Liberar a proceso técnico (Sistemas)?')) return;
                                    void ejecutar('liberar');
                                }}
                            >
                                Liberar a proceso técnico
                            </ActionButton>
                        ) : null}

                        {upnCan('pdf') ? (
                            <Link to={`/app/documentos/${id}`} className="inst-btn inst-btn-secondary text-sm text-center">
                                Ver documento / PDF
                            </Link>
                        ) : null}

                        {upnCanProcesoTecnico() ? (
                            <Link
                                to={`/app/sistemas/proceso-tecnico-certificacion/${id}`}
                                className="inst-btn inst-btn-secondary text-sm text-center"
                            >
                                Proceso técnico (Sistemas)
                            </Link>
                        ) : null}

                        {bloqueosLiberar.length > 0 && upnCan('liberar') ? (
                            <p style={{ fontSize: 11, color: '#BA7517', margin: 0 }}>{bloqueosLiberar.join(' ')}</p>
                        ) : null}
                    </aside>
                </div>
            </EsPageLayout>
        </RequirePermission>
    );
}
