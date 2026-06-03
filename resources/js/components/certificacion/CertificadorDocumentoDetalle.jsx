import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
import { DataTable } from '../../components/ui/DataTable';
import { SectionCard } from '../../components/ui/SectionCard';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { UX_COPY } from '../../utils/uxInstitucional';
import { docTieneAccion } from '../../utils/documentoWorkflow';
import { etiquetaTipoDocumental } from '../../utils/certificadorUx';
import { CertificadorChecklistAcademico } from './CertificadorChecklistAcademico';
import { CertificacionWorkflowBadge } from './CertificacionStatusBadge';

export function CertificadorDocumentoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [workflowDoc, setWorkflowDoc] = useState(null);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);
    const [showDevolver, setShowDevolver] = useState(searchParams.get('accion') === 'devolver');
    const [motivoDevolver, setMotivoDevolver] = useState('');
    const [observacionDevolver, setObservacionDevolver] = useState('');

    const cargar = useCallback(async () => {
        setError('');
        try {
            const [rev, show] = await Promise.all([
                documentosAcademicosApi.revisionInstitucional(id),
                documentosAcademicosApi.show(id),
            ]);
            setData(rev?.data ?? null);
            setWorkflowDoc(show?.data ?? null);
        } catch (e) {
            setData(null);
            setWorkflowDoc(null);
            setError(e?.message ?? 'No se pudo cargar la solicitud.');
        }
    }, [id]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    useEffect(() => {
        if (searchParams.get('accion') === 'devolver') {
            setShowDevolver(true);
        }
    }, [searchParams]);

    if (data === null && !error) {
        return <LoadingState text="Cargando solicitud para validación…" />;
    }
    if (!data) {
        return <ErrorState message={error || 'Solicitud no disponible.'} />;
    }

    const doc = data.documento;
    const puedeValidar = docTieneAccion(workflowDoc, 'validar_informacion');
    const puedeDevolver = docTieneAccion(workflowDoc, 'devolver_observaciones');
    const materiasRows = (data.materias_cursadas ?? []).map((m) => ({
        clave: m.clave,
        nombre: m.nombre,
        calificacion: m.calificacion ?? m.calificacion_texto ?? '—',
        periodo: m.periodo_cursado ?? m.periodo ?? '—',
    }));

    const motivoCompleto = [motivoDevolver.trim(), observacionDevolver.trim()].filter(Boolean).join(' — ');

    async function validarInformacion() {
        if (
            !window.confirm(
                'La información académica será marcada como validada y pasará a Educación Superior. ¿Desea continuar?',
            )
        ) {
            return;
        }
        setBusy(true);
        setError('');
        setMsg('');
        try {
            await documentosAcademicosApi.validarInformacion(id, {
                motivo: 'Información académica validada por el Certificador.',
            });
            setMsg('La información académica fue validada. El documento pasó a Educación Superior.');
            await cargar();
            setTimeout(() => navigate('/app/certificacion/documentos-a-certificar'), 1200);
        } catch (e) {
            setError(e?.message ?? 'No se pudo validar la información.');
        } finally {
            setBusy(false);
        }
    }

    async function devolverConObservaciones() {
        if (!motivoDevolver.trim()) {
            setError('El motivo de devolución es obligatorio.');
            return;
        }
        setBusy(true);
        setError('');
        setMsg('');
        try {
            await documentosAcademicosApi.rechazar(id, {
                motivo: motivoCompleto,
            });
            setMsg('La solicitud fue devuelta a Control Escolar para corrección.');
            setShowDevolver(false);
            setSearchParams({});
            await cargar();
        } catch (e) {
            const det = e?.payload?.errors ?? e?.errors;
            if (det?.motivo) {
                setError(Array.isArray(det.motivo) ? det.motivo.join(' ') : String(det.motivo));
            } else {
                setError(e?.message ?? 'No se pudo devolver la solicitud.');
            }
        } finally {
            setBusy(false);
        }
    }

    const etapa = workflowDoc?.workflow?.estado_actual ?? doc?.metadata?.etapa_institucional;

    return (
        <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-4">
                <PageHeader
                    title={`Validación académica · solicitud #${doc?.id}`}
                    subtitle={`${data.alumno?.nombre_completo ?? ''} · ${etiquetaTipoDocumental(doc?.tipo_documento)}`}
                    actions={
                        <Link
                            to="/app/certificacion/documentos-a-certificar"
                            className="inst-btn inst-btn-secondary text-sm"
                        >
                            Volver a bandeja
                        </Link>
                    }
                />

                <InstitutionalRoleBanner message={UX_COPY.certificador} />

                {msg ? <AlertBox type="success" message={msg} /> : null}
                {error ? <AlertBox type="danger" message={error} /> : null}

                <SectionCard title="Estado de la solicitud">
                    <div className="flex flex-wrap items-center gap-2">
                        <CertificacionWorkflowBadge etapa={etapa} workflow={doc?.estado_workflow} />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                        Tipo documental: <strong>{etiquetaTipoDocumental(doc?.tipo_documento)}</strong>
                    </p>
                </SectionCard>

                <SectionCard title="1. Datos del alumno">
                    <p className="text-sm">
                        <strong>Nombre:</strong> {data.alumno?.nombre_completo ?? '—'}
                    </p>
                    <p className="text-sm mt-1">
                        <strong>CURP:</strong> {data.alumno?.curp ?? '—'}
                    </p>
                    {data.alumno?.id ? (
                        <Link
                            to={`/app/alumnos/${data.alumno.id}/expediente`}
                            className="inst-btn inst-btn-secondary text-xs mt-3 inline-flex"
                        >
                            Ver expediente académico
                        </Link>
                    ) : null}
                </SectionCard>

                <SectionCard title="2. Matrícula e institución">
                    <p className="text-sm">
                        <strong>Matrícula:</strong> {data.matricula?.matricula ?? '—'}
                    </p>
                    <p className="text-sm mt-1">
                        <strong>Institución / CCT:</strong>{' '}
                        {data.institucion?.clave
                            ? `${data.institucion?.nombre ?? ''} (${data.institucion.clave})`
                            : data.institucion?.nombre ?? '—'}
                    </p>
                    <p className="text-sm mt-1">
                        <strong>Sede:</strong> {data.sede?.clave ?? data.sede?.nombre ?? '—'}
                    </p>
                </SectionCard>

                <SectionCard title="3. Programa y plan">
                    <p className="text-sm">
                        <strong>Programa:</strong> {data.programa?.nombre ?? data.programa ?? '—'}
                    </p>
                    <p className="text-sm mt-1">
                        <strong>Plan:</strong> {data.plan?.nombre ?? data.plan ?? '—'}
                    </p>
                    <p className="text-sm mt-1">
                        <strong>Ciclo escolar:</strong> {data.ciclo_escolar?.nombre ?? '—'}
                    </p>
                </SectionCard>

                <SectionCard title="4. Trayectoria académica">
                    {data.trayectoria ? (
                        <ul className="text-sm grid gap-1">
                            <li>
                                <strong>Promedio:</strong>{' '}
                                {data.trayectoria.promedio ?? data.trayectoria.promedio_aprovechamiento ?? '—'}
                            </li>
                            <li>
                                <strong>Créditos:</strong>{' '}
                                {data.trayectoria.creditos_obtenidos ?? data.trayectoria.creditos_acumulados ?? '—'}
                            </li>
                        </ul>
                    ) : (
                        <p className="text-sm text-amber-800">Trayectoria no consolidada en expediente.</p>
                    )}
                </SectionCard>

                <SectionCard title="5. Materias / carga académica">
                    <DataTable
                        columns={[
                            { key: 'clave', label: 'Clave' },
                            { key: 'nombre', label: 'Materia' },
                            { key: 'calificacion', label: 'Calificación' },
                            { key: 'periodo', label: 'Periodo' },
                        ]}
                        rows={materiasRows}
                        emptyText="Sin materias registradas."
                    />
                </SectionCard>

                <SectionCard title="6. Promedio y créditos">
                    <p className="text-sm text-slate-600">
                        Resumen en trayectoria. El Certificador confirma coherencia con el plan de estudios.
                    </p>
                </SectionCard>

                <SectionCard title="7. Checklist académico">
                    <CertificadorChecklistAcademico data={data} />
                    {!data.validacion?.valido && (data.validacion?.errores ?? []).length > 0 ? (
                        <ul className="mt-3 text-xs text-amber-800 grid gap-1">
                            {(data.validacion.errores ?? []).map((e, i) => (
                                <li key={i}>• {String(e)}</li>
                            ))}
                        </ul>
                    ) : null}
                </SectionCard>

                <SectionCard title="8. Observaciones">
                    {(data.observaciones ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500">Sin observaciones registradas.</p>
                    ) : (
                        <ul className="grid gap-2 text-sm max-h-56 overflow-y-auto">
                            {(data.observaciones ?? []).map((o) => (
                                <li key={o.id} className="border-b border-slate-100 pb-2">
                                    <span className="font-medium">{o.seccion ?? o.tipo}</span>
                                    <span
                                        className={`ml-2 text-xs ${o.estado === 'pendiente' ? 'text-amber-700' : 'text-slate-500'}`}
                                    >
                                        {o.estado}
                                    </span>
                                    <p className="text-slate-700 mt-1">{o.observacion}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
            </div>

            <aside className="inst-surface grid h-max gap-3 p-4">
                <h3 className="inst-title text-sm">9. Decisión del Certificador</h3>
                <p className="text-xs text-slate-600">
                    Revise la información académica. No aprueba institucionalmente, no asigna folio ni procesa el
                    documento final.
                </p>

                {puedeValidar ? (
                    <ActionButton disabled={busy} onClick={() => void validarInformacion()}>
                        Validar información
                    </ActionButton>
                ) : (
                    <p className="text-xs text-slate-500">La validación no está disponible en la etapa actual.</p>
                )}

                {puedeDevolver ? (
                    <ActionButton variant="secondary" disabled={busy} onClick={() => setShowDevolver((v) => !v)}>
                        Devolver con observaciones
                    </ActionButton>
                ) : null}

                {showDevolver && puedeDevolver ? (
                    <div className="grid gap-2 border-t border-slate-200 pt-3">
                        <p className="text-xs text-amber-800 m-0">
                            La solicitud será devuelta a Control Escolar para corrección.
                        </p>
                        <label className="grid gap-1 text-xs">
                            <span className="font-medium text-slate-700">Motivo (obligatorio)</span>
                            <input
                                className="inst-input text-sm"
                                value={motivoDevolver}
                                onChange={(e) => setMotivoDevolver(e.target.value)}
                                placeholder="Ej. Falta constancia de servicio social"
                            />
                        </label>
                        <label className="grid gap-1 text-xs">
                            <span className="font-medium text-slate-700">Observación institucional</span>
                            <textarea
                                className="inst-input text-sm min-h-[72px]"
                                value={observacionDevolver}
                                onChange={(e) => setObservacionDevolver(e.target.value)}
                                placeholder="Detalle para Control Escolar"
                            />
                        </label>
                        <ActionButton
                            variant="danger"
                            disabled={busy || !motivoDevolver.trim()}
                            onClick={() => void devolverConObservaciones()}
                        >
                            Confirmar devolución
                        </ActionButton>
                    </div>
                ) : null}
            </aside>
        </section>
    );
}
