import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { decNormalApi, firmaSinceApi } from '../../api/decNormal';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { sicesLegacyApi } from '../../api/sicesLegacy';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { EstadoSepLegacyPanel } from '../expedientes/components/EstadoSepLegacyPanel';
import { CertificadoPdfPreview } from '../../components/certificacion/CertificadoPdfPreview';
import { canProcesoTecnico, puedeEjecutarTecnico } from '../../utils/procesoTecnicoPermissions';
import { PROCESO_TECNICO_BANDEJA_PATH } from '../../utils/certificacionRoutes';
import {
    TecnicoEstadoBadge,
    estadoCadenaLabel,
    estadoFirmaLabel,
    estadoPayloadLabel,
    estadoPreflightLabel,
    estadoXmlLabel,
} from '../../utils/procesoTecnicoEstados';

function bloqueJson(titulo, data, maxHeight = '240px') {
    if (data === null || data === undefined) {
        return <p className="text-sm text-slate-500">Sin datos.</p>;
    }
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return (
        <details className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">{titulo}</summary>
            <pre
                className="inst-surface-muted p-3 mt-2 overflow-auto text-xs"
                style={{ maxHeight }}
            >
                {text.length > 12000 ? `${text.slice(0, 12000)}\n… (truncado)` : text}
            </pre>
        </details>
    );
}

export function DocumentoProcesoTecnicoPage() {
    const { documentoId, id: legacyId } = useParams();
    const id = documentoId ?? legacyId;
    const [doc, setDoc] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [payload, setPayload] = useState(null);
    const [cadena, setCadena] = useState(null);
    const [xml, setXml] = useState(null);
    const [validacionXml, setValidacionXml] = useState(null);
    const [erroresTec, setErroresTec] = useState(null);
    const [preflight, setPreflight] = useState(null);
    const [legacyCfg, setLegacyCfg] = useState(null);
    const [sinceCfg, setSinceCfg] = useState(null);
    const [tab, setTab] = useState('resumen');

    const DETALLE_TABS = [
        { key: 'resumen', label: 'Resumen' },
        { key: 'payload', label: 'Payload' },
        { key: 'cadena', label: 'Cadena original' },
        { key: 'xml', label: 'XML' },
        { key: 'validaciones', label: 'Validaciones' },
        { key: 'firma', label: 'Firma / timbrado' },
        { key: 'archivos', label: 'PDF' },
        { key: 'historial', label: 'Historial / reintentos' },
    ];

    const cargar = useCallback(async () => {
        if (!id) {
            return;
        }
        setError('');
        try {
            const res = await documentosAcademicosApi.show(id);
            setDoc(res?.data ?? null);
        } catch (e) {
            setDoc(false);
            setError(e?.message ?? 'No se pudo cargar el documento.');
        }
    }, [id]);

    useEffect(() => {
        if (!id) {
            setDoc(undefined);
            setError('');
            return;
        }
        setDoc(null);
        void cargar();
    }, [cargar, id]);

    useEffect(() => {
        sicesLegacyApi.health()
            .then((res) => setLegacyCfg(res?.data ?? res ?? null))
            .catch(() => setLegacyCfg(null));
        firmaSinceApi.config()
            .then((res) => setSinceCfg(res?.data ?? res ?? null))
            .catch(() => setSinceCfg(null));
    }, []);

    async function ejecutar(accion) {
        setBusy(true);
        setError('');
        setMsg('');
        try {
            if (accion === 'payload') {
                const res = await decNormalApi.generarPayload(id);
                setPayload(res?.data ?? null);
                setMsg('Payload técnico generado.');
            }
            if (accion === 'cadena') {
                const res = await decNormalApi.generarCadena(id);
                setCadena(res?.data ?? null);
                setMsg('Cadena original generada.');
            }
            if (accion === 'xml') {
                const res = await decNormalApi.generarXml(id);
                setXml(res?.data ?? null);
                setMsg('XML DEC generado.');
            }
            if (accion === 'validar') {
                const res = await decNormalApi.validarXml(id);
                setValidacionXml(res?.data ?? null);
                setMsg(res?.data?.ok ? 'XML validado correctamente.' : 'XML con errores de validación.');
            }
            if (accion === 'errores') {
                const res = await decNormalApi.errores(id);
                setErroresTec(res?.data ?? null);
                setMsg('Errores técnicos actualizados.');
            }
            if (accion === 'preflight') {
                try {
                    const res = await decNormalApi.preflight(id);
                    setPreflight(res?.data ?? null);
                    setMsg(res?.data?.ok ? 'Preflight correcto.' : 'Preflight con observaciones.');
                } catch (e) {
                    const pf = e?.legacy ?? e?.original?.response?.data?.data;
                    if (pf) {
                        setPreflight(pf);
                        setMsg('Preflight con errores.');
                    } else {
                        throw e;
                    }
                }
            }
            if (accion === 'firmaSep') {
                const res = await firmaSinceApi.ejecutar(id);
                if (res?.success) {
                    setMsg(res?.message ?? 'Documento firmado con SEP/SINCE.');
                } else {
                    setError(res?.message ?? 'No se pudo firmar el documento.');
                }
            }
            if (accion === 'shadowExport') {
                try {
                    const res = await decNormalApi.shadowExport(id);
                    if (res?.success) {
                        setMsg(res?.message ?? 'Exportado a SICES legacy.');
                    } else {
                        const errs = res?.errors ?? [];
                        setError(errs.join(' ') || res?.message || 'No se pudo exportar.');
                    }
                } catch (e) {
                    const body = e?.original?.response?.data;
                    if (body) {
                        const errs = body.errors ?? [];
                        setError(
                            Array.isArray(errs) ? errs.join(' ') : String(errs || body.message || e.message),
                        );
                    } else {
                        throw e;
                    }
                }
            }
            await cargar();
        } catch (e) {
            setError(e?.message ?? 'Error en operación técnica.');
        } finally {
            setBusy(false);
        }
    }

    if (id === undefined) {
        return (
            <RequirePermission anyOf={['firma.ver', 'documentos.ver', 'ver_documentos', 'generar_cadena', 'cadena_original.generar']}>
                <section className="grid gap-4">
                    <PageHeader
                        title="Diagnóstico técnico del documento"
                        subtitle="Consulta de payload, cadena, XML, firma y logs para atender incidencias."
                        actions={(
                            <Link
                                to={PROCESO_TECNICO_BANDEJA_PATH}
                                className="inst-btn inst-btn-secondary text-sm"
                            >
                                Ir a bandeja
                            </Link>
                        )}
                    />
                    <div className="inst-surface p-8 text-center grid gap-3 max-w-xl mx-auto">
                        <h2 className="inst-title text-base">Sin documento seleccionado</h2>
                        <p className="inst-muted text-sm">
                            Selecciona una incidencia o documento desde la bandeja técnica para consultar el diagnóstico.
                        </p>
                        <div>
                            <Link to={PROCESO_TECNICO_BANDEJA_PATH} className="inst-btn inst-btn-primary text-sm">
                                Ir a incidencias técnicas
                            </Link>
                        </div>
                    </div>
                </section>
            </RequirePermission>
        );
    }

    if (doc === null) return <LoadingState text="Cargando diagnóstico técnico…" />;
    if (doc === false) return <ErrorState message={error || 'Documento no disponible.'} />;

    const listoTecnico = Boolean(doc.listo_para_firma);
    const firmado = doc.estado_firma === 'firmado' || doc.estado_firma === 'firmando';
    const puedeOperar = listoTecnico && !firmado && puedeEjecutarTecnico();
    const shadowMeta = doc?.metadata?.legacy_shadow ?? {};
    const firmaMeta = doc?.metadata?.firma_servicio_34 ?? {};
    const shadowHabilitado = Boolean(legacyCfg?.shadow_enabled && legacyCfg?.write_enabled);
    const preflightOk = Boolean(preflight?.ok);
    const shadowExportado = Boolean(
        shadowMeta.exported
        && (shadowMeta.last_success_at || shadowMeta.exported_at)
        && (shadowMeta.url_short || doc.token_consulta_publica),
    );
    const sinceHabilitado = Boolean(sinceCfg?.since_firma_enabled);
    const cancelado = doc.estado_workflow === 'cancelado';
    const puedeExportarShadow =
        shadowHabilitado
        && preflightOk
        && puedeOperar
        && canProcesoTecnico('shadowExport')
        && !firmado;
    const puedeFirmarSep =
        sinceHabilitado
        && preflightOk
        && shadowExportado
        && puedeOperar
        && !cancelado
        && canProcesoTecnico('firmaSep');

    return (
        <RequirePermission anyOf={['firma.ver', 'documentos.ver', 'ver_documentos', 'generar_cadena', 'cadena_original.generar']}>
            <section className="grid gap-4">
                <div className="grid gap-4">
                    <PageHeader
                        title={`Diagnóstico técnico #${doc.id}`}
                        subtitle={`${doc.alumno?.nombre_completo ?? ''} · ${doc.alumno?.curp ?? ''}`}
                        actions={(
                            <Link
                                to={PROCESO_TECNICO_BANDEJA_PATH}
                                className="inst-btn inst-btn-secondary text-sm"
                            >
                                Volver a bandeja
                            </Link>
                        )}
                    />

                    {!listoTecnico ? (
                        <AlertBox
                            type="warning"
                            message="El documento aún no ha iniciado procesamiento técnico. Educación Superior debe procesar la certificación desde su bandeja operativa."
                        />
                    ) : null}

                    <nav className="flex flex-wrap gap-2" aria-label="Secciones técnicas">
                        {DETALLE_TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={tab === t.key ? 'inst-btn inst-btn-primary text-sm' : 'inst-btn inst-btn-secondary text-sm'}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    <SectionCard title="Acciones técnicas">
                        <div className="flex flex-wrap gap-2">
                            {!puedeOperar ? (
                                <p className="text-xs text-slate-500 w-full">
                                    {firmado
                                        ? 'Documento firmado: solo consulta.'
                                        : 'Sin permisos técnicos o documento no liberado.'}
                                </p>
                            ) : null}
                            {canProcesoTecnico('payload') ? (
                                <ActionButton variant="secondary" disabled={busy || !puedeOperar} onClick={() => void ejecutar('payload')}>
                                    Generar payload
                                </ActionButton>
                            ) : null}
                            {canProcesoTecnico('cadena') ? (
                                <ActionButton disabled={busy || !puedeOperar} onClick={() => void ejecutar('cadena')}>
                                    Generar cadena
                                </ActionButton>
                            ) : null}
                            {canProcesoTecnico('xml') ? (
                                <ActionButton disabled={busy || !puedeOperar} onClick={() => void ejecutar('xml')}>
                                    Generar XML
                                </ActionButton>
                            ) : null}
                            {canProcesoTecnico('validarXml') ? (
                                <ActionButton variant="secondary" disabled={busy || !puedeOperar} onClick={() => void ejecutar('validar')}>
                                    Validar XML
                                </ActionButton>
                            ) : null}
                            {canProcesoTecnico('preflight') ? (
                                <ActionButton
                                    variant="warning"
                                    disabled={busy || !puedeOperar}
                                    onClick={() => {
                                        if (!window.confirm('¿Ejecutar preflight técnico (sin firma SEP)?')) return;
                                        void ejecutar('preflight');
                                    }}
                                >
                                    Preflight
                                </ActionButton>
                            ) : null}
                            {canProcesoTecnico('firmaSep') ? (
                                <ActionButton
                                    variant="warning"
                                    disabled={busy || !puedeFirmarSep}
                                    onClick={() => {
                                        if (!window.confirm('¿Enviar al servicio oficial de firma SEP/SINCE?')) return;
                                        void ejecutar('firmaSep');
                                    }}
                                >
                                    Firmar SEP
                                </ActionButton>
                            ) : null}
                        </div>
                    </SectionCard>

                    {error ? <ErrorState message={error} /> : null}
                    {msg ? <AlertBox type="success" message={msg} /> : null}

                    {tab === 'resumen' ? (
                        <>
                            <SectionCard title="Resumen del documento">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <TecnicoEstadoBadge estado={estadoPayloadLabel(doc)} />
                                    <TecnicoEstadoBadge estado={estadoCadenaLabel(doc.estado_cadena)} />
                                    <TecnicoEstadoBadge estado={estadoXmlLabel(doc.estado_xml)} />
                                    <TecnicoEstadoBadge estado={estadoFirmaLabel(doc)} />
                                    <TecnicoEstadoBadge estado={estadoPreflightLabel(preflight)} />
                                </div>
                                <p className="text-sm mt-2">
                                    Folio: {doc.folio_interno ?? '—'} · Workflow: {doc.estado_workflow} · Tipo: {doc.tipo_documento} ({doc.tipo_certificacion})
                                </p>
                                {doc.listo_para_firma_marcado_en ? (
                                    <p className="text-sm text-slate-600">
                                        Liberación técnica: {new Date(doc.listo_para_firma_marcado_en).toLocaleString('es-MX')}
                                    </p>
                                ) : null}
                            </SectionCard>
                            <SectionCard title="Datos académicos">
                                <p className="text-sm"><strong>Alumno:</strong> {doc.alumno?.nombre_completo ?? '—'}</p>
                                <p className="text-sm"><strong>CURP:</strong> {doc.alumno?.curp ?? '—'}</p>
                                <p className="text-sm"><strong>Matrícula:</strong> {doc.matricula?.matricula ?? '—'}</p>
                                <p className="text-sm"><strong>Institución / sede:</strong> {doc.institucion?.nombre ?? '—'} · {doc.sede?.clave ?? doc.sede?.nombre ?? '—'}</p>
                                <p className="text-sm"><strong>Programa / plan:</strong> {doc.programa?.nombre ?? '—'} / {doc.plan?.nombre ?? '—'}</p>
                            </SectionCard>
                            <EstadoSepLegacyPanel
                                alumnoId={doc.alumno_id ?? doc.alumno?.id}
                                documentoId={doc.id}
                                curp={doc.alumno?.curp}
                            />
                        </>
                    ) : null}

                    {tab === 'payload' ? (
                        <SectionCard title="Payload técnico">
                            {bloqueJson('Ver payload', payload?.payload ?? payload)}
                        </SectionCard>
                    ) : null}

                    {tab === 'cadena' ? (
                        <SectionCard title="Cadena original">
                            {bloqueJson('Ver cadena', cadena?.cadena_original ?? cadena)}
                        </SectionCard>
                    ) : null}

                    {tab === 'xml' ? (
                        <SectionCard title="XML DEC">
                            {bloqueJson('Ver XML', xml?.xml ?? xml, '320px')}
                        </SectionCard>
                    ) : null}

                    {tab === 'validaciones' ? (
                        <SectionCard title="Validaciones y errores">
                            {validacionXml ? (
                                <div className="mb-3">
                                    <p className="text-sm font-medium">
                                        Validación XSD: {validacionXml.ok ? 'OK' : 'Con errores'}
                                    </p>
                                    {(validacionXml.errores ?? []).length > 0 ? (
                                        <ul className="list-disc pl-5 text-sm text-amber-800 mt-1">
                                            {validacionXml.errores.map((err, i) => (
                                                <li key={i}>{String(err)}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            ) : null}
                            {erroresTec ? bloqueJson('Detalle técnico', erroresTec) : (
                                <p className="text-sm text-slate-500">Use el botón de errores técnicos en acciones.</p>
                            )}
                            {canProcesoTecnico('errores') ? (
                                <ActionButton variant="secondary" disabled={busy} className="mt-3" onClick={() => void ejecutar('errores')}>
                                    Ver errores técnicos
                                </ActionButton>
                            ) : null}
                        </SectionCard>
                    ) : null}

                    {tab === 'firma' ? (
                        <>
                            <SectionCard title="Firma SEP / SINCE (servicio 34)">
                                <dl className="grid gap-1 text-sm sm:grid-cols-2">
                                    <div><dt className="text-slate-500">SINCE habilitado</dt><dd>{sinceHabilitado ? 'Sí' : 'No'}</dd></div>
                                    <div><dt className="text-slate-500">Shadow exportado</dt><dd>{shadowExportado ? 'Sí' : 'No'}</dd></div>
                                    <div><dt className="text-slate-500">URL short</dt><dd className="font-mono text-xs break-all">{shadowMeta.url_short ?? doc.token_consulta_publica ?? '—'}</dd></div>
                                    <div><dt className="text-slate-500">Estado firma</dt><dd><TecnicoEstadoBadge estado={estadoFirmaLabel(doc)} /></dd></div>
                                    <div><dt className="text-slate-500">Folio digital SEP</dt><dd>{doc.folio_digital_sep ?? '—'}</dd></div>
                                    <div><dt className="text-slate-500">Último intento</dt><dd>{firmaMeta.last_attempt_at ? new Date(firmaMeta.last_attempt_at).toLocaleString('es-MX') : '—'}</dd></div>
                                    <div className="sm:col-span-2"><dt className="text-slate-500">Último error</dt><dd className="text-amber-800">{firmaMeta.last_error ?? '—'}</dd></div>
                                </dl>
                            </SectionCard>
                            <SectionCard title="Preflight">
                                {preflight ? (
                                    <>
                                        <TecnicoEstadoBadge estado={estadoPreflightLabel(preflight)} />
                                        {(preflight.errores ?? []).length > 0 ? (
                                            <ul className="list-disc pl-5 text-sm text-amber-800 mt-2">
                                                {preflight.errores.map((e, i) => (
                                                    <li key={i}>{e}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-green-800 mt-2">Listo para la siguiente fase.</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500">Ejecute preflight tras generar payload, cadena y XML.</p>
                                )}
                            </SectionCard>
                        </>
                    ) : null}

                    {tab === 'archivos' ? (
                        <SectionCard title="Archivos y vista previa">
                            <CertificadoPdfPreview documentoId={id} estadoFirma={doc?.estado_firma} />
                        </SectionCard>
                    ) : null}

                    {tab === 'historial' ? (
                        <SectionCard title="Historial técnico">
                            {bloqueJson('Metadata del documento', doc?.metadata ?? {})}
                            {bloqueJson('Última firma', firmaMeta)}
                            {bloqueJson('Shadow legacy', shadowMeta)}
                        </SectionCard>
                    ) : null}
                </div>
            </section>
        </RequirePermission>
    );
}
