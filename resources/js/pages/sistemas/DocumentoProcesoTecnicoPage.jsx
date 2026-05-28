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
    const { id } = useParams();
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

    const cargar = useCallback(async () => {
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
        void cargar();
    }, [cargar]);

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

    if (doc === null) return <LoadingState text="Cargando proceso técnico…" />;
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
            <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
                <div className="grid gap-4">
                    <PageHeader
                        title={`Proceso técnico #${doc.id}`}
                        subtitle={`${doc.alumno?.nombre_completo ?? ''} · ${doc.alumno?.curp ?? ''}`}
                        actions={(
                            <Link
                                to="/app/sistemas/proceso-tecnico-certificacion"
                                className="inst-btn inst-btn-secondary text-sm"
                            >
                                Volver a bandeja
                            </Link>
                        )}
                    />

                    {!listoTecnico ? (
                        <AlertBox
                            type="warning"
                            message="El documento aún no está liberado a proceso técnico. Certificación debe liberarlo desde revisión institucional."
                        />
                    ) : null}

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

                    <SectionCard title="Payload técnico">
                        {bloqueJson('Ver payload', payload?.payload ?? payload)}
                    </SectionCard>

                    <SectionCard title="Cadena original">
                        {bloqueJson('Ver cadena', cadena?.cadena_original ?? cadena)}
                    </SectionCard>

                    <SectionCard title="XML DEC">
                        {bloqueJson('Ver XML', xml?.xml ?? xml, '320px')}
                    </SectionCard>

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
                        {erroresTec ? bloqueJson('Detalle técnico', erroresTec) : <p className="text-sm text-slate-500">Use «Ver errores técnicos».</p>}
                    </SectionCard>

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
                        {!sinceHabilitado ? (
                            <p className="text-xs text-slate-500 mt-2">Active SINCE_FIRMA_ENABLED en el entorno para habilitar firma real.</p>
                        ) : null}
                        {!shadowExportado && preflightOk ? (
                            <p className="text-xs text-amber-700 mt-2">Exporte a SICES legacy antes de firmar con SEP.</p>
                        ) : null}
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
                                    <p className="text-sm text-green-800 mt-2">Listo para la siguiente fase (sin llamar servicio 34).</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Ejecute preflight tras generar payload, cadena y XML.</p>
                        )}
                    </SectionCard>

                    {error ? <ErrorState message={error} /> : null}
                    {msg ? <AlertBox type="success" message={msg} /> : null}
                </div>

                <aside className="inst-surface grid h-max gap-3 p-4">
                    <h3 className="inst-title text-sm">Acciones técnicas</h3>
                    {!puedeOperar ? (
                        <p className="text-xs text-slate-500">
                            {firmado
                                ? 'Documento firmado: solo consulta.'
                                : 'Sin permisos técnicos o documento no liberado.'}
                        </p>
                    ) : null}

                    {canProcesoTecnico('payload') ? (
                        <ActionButton variant="secondary" disabled={busy || !puedeOperar} onClick={() => void ejecutar('payload')}>
                            Generar payload técnico
                        </ActionButton>
                    ) : null}
                    {canProcesoTecnico('cadena') ? (
                        <ActionButton disabled={busy || !puedeOperar} onClick={() => void ejecutar('cadena')}>
                            Generar cadena original
                        </ActionButton>
                    ) : null}
                    {canProcesoTecnico('xml') ? (
                        <ActionButton disabled={busy || !puedeOperar} onClick={() => void ejecutar('xml')}>
                            Generar XML DEC
                        </ActionButton>
                    ) : null}
                    {canProcesoTecnico('validarXml') ? (
                        <ActionButton variant="secondary" disabled={busy || !puedeOperar} onClick={() => void ejecutar('validar')}>
                            Validar XML
                        </ActionButton>
                    ) : null}
                    {canProcesoTecnico('errores') ? (
                        <ActionButton variant="secondary" disabled={busy} onClick={() => void ejecutar('errores')}>
                            Ver errores técnicos
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
                            Ejecutar preflight
                        </ActionButton>
                    ) : null}
                    {canProcesoTecnico('shadowExport') ? (
                        <ActionButton
                            variant="secondary"
                            disabled={busy || !puedeExportarShadow}
                            onClick={() => {
                                if (!window.confirm('¿Exportar documento a SICES legacy (shadow)? No ejecuta firma SEP.')) return;
                                void ejecutar('shadowExport');
                            }}
                        >
                            Exportar a SICES legacy
                        </ActionButton>
                    ) : null}
                    {canProcesoTecnico('firmaSep') ? (
                        <ActionButton
                            variant="warning"
                            disabled={busy || !puedeFirmarSep}
                            onClick={() => {
                                if (!window.confirm(
                                    'Esta acción enviará el documento al servicio oficial de firma SEP/SINCE (servicio 34). '
                                    + 'No podrá modificarse después. ¿Continuar?',
                                )) return;
                                void ejecutar('firmaSep');
                            }}
                        >
                            Firmar con SEP/SINCE
                        </ActionButton>
                    ) : null}

                    <p className="text-xs text-slate-400 border-t pt-2 mt-2">
                        La generación de PDF oficial Jasper no se ejecuta aquí; use la vista previa tras firma.
                    </p>
                </aside>
            </section>
            <CertificadoPdfPreview documentoId={id} estadoFirma={doc?.estado_firma} />
        </RequirePermission>
    );
}
