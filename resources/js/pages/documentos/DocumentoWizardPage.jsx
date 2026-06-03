import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { EstadoBadge } from '../../components/EstadoBadge';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { ValidationSummary } from '../../components/academic/ValidationSummary';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { Stepper } from '../../components/ui/Stepper';
import { userCanAny } from '../../utils/userPermissions';

const STEPS = [
    'Datos del documento',
    'Expediente y materias',
    'Validación académica',
    'Enviar a revisión',
];

function CapturaIndice() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Certificación electrónica"
                subtitle="Inicie desde el expediente del alumno o desde la bandeja de documentos."
            />
            <SectionCard title="Inicio rápido">
                <div className="flex flex-wrap gap-2">
                    <Link to="/app/expedientes" className="inst-btn inst-btn-primary text-sm">
                        Expedientes 360°
                    </Link>
                    <Link to="/app/documentos/bandejas/borradores" className="inst-btn inst-btn-secondary text-sm">
                        Bandeja de borradores
                    </Link>
                    <Link to="/app/materias-cursadas" className="inst-btn inst-btn-secondary text-sm">
                        Capturar calificaciones
                    </Link>
                </div>
                <p className="subtle-help-text mt-3">
                    Para iniciar una solicitud documental: abra el expediente del alumno → pestaña Certificación → Iniciar solicitud documental.
                </p>
            </SectionCard>
        </section>
    );
}

function CapturaDocumento({ documentoId }) {
    const navigate = useNavigate();
    const [doc, setDoc] = useState(null);
    const [validacion, setValidacion] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const canEnviar = userCanAny(['enviar_revision', 'documentos.enviar_revision']);
    const canEditar = userCanAny(['editar_documentos', 'documentos.editar', 'crear_documentos', 'documentos.crear_borrador']);

    const cargar = useCallback(async () => {
        setBusy(true);
        setError('');
        try {
            const res = await documentosAcademicosApi.show(documentoId);
            setDoc(res?.data ?? null);
            try {
                const v = await documentosAcademicosApi.validar(documentoId);
                setValidacion(v?.data ?? null);
            } catch {
                setValidacion(null);
            }
        } catch (e) {
            setDoc(false);
            setError(e?.message ?? 'No se pudo cargar el documento.');
        } finally {
            setBusy(false);
        }
    }, [documentoId]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const pasoActual = useMemo(() => {
        if (!doc) return 0;
        if (doc.estado_workflow === 'borrador') return validacion?.valido ? 3 : 2;
        if (doc.estado_workflow === 'en_revision') return 3;
        return 3;
    }, [doc, validacion]);

    const bloqueosEnvio = useMemo(() => {
        const errs = [];
        if (!validacion?.valido) {
            errs.push('La validación académica no está completa.');
            (validacion?.errores ?? []).forEach((e) => errs.push(String(e)));
        }
        if (doc?.tiene_observaciones_pendientes) {
            errs.push('Hay observaciones pendientes en el documento.');
        }
        if (!['borrador', 'pendiente'].includes(doc?.estado_workflow ?? '')) {
            if (doc?.estado_workflow === 'en_revision') {
                errs.push('El documento ya fue enviado a revisión.');
            } else if (doc?.estado_workflow !== 'rechazado') {
                errs.push(`Estado actual (${doc?.estado_workflow}) no permite envío desde captura.`);
            }
        }
        return errs;
    }, [doc, validacion]);

    async function ejecutar(accion) {
        setBusy(true);
        setError('');
        setMsg('');
        try {
            if (accion === 'validar') {
                const v = await documentosAcademicosApi.validar(documentoId);
                setValidacion(v?.data ?? null);
                setMsg('Validación actualizada.');
            }
            if (accion === 'pendiente') {
                await documentosAcademicosApi.pasarPendiente(documentoId, { motivo: 'Captura completada — pasar a pendiente.' });
                setMsg('Documento marcado como pendiente de envío.');
            }
            if (accion === 'enviar') {
                await documentosAcademicosApi.enviarRevision(documentoId, { motivo: 'Enviado a revisión institucional desde captura.' });
                setMsg('Documento enviado a revisión.');
                navigate(`/app/documentos/${documentoId}`);
                return;
            }
            await cargar();
        } catch (e) {
            const det = e?.payload?.errors ?? e?.errors;
            if (det && typeof det === 'object') {
                const flat = Object.values(det).flat().join(' ');
                setError(flat || e?.message || 'Error en la operación.');
            } else {
                setError(e?.message ?? 'Error en la operación.');
            }
        } finally {
            setBusy(false);
        }
    }

    if (doc === null) return <LoadingState text="Cargando captura del documento..." />;
    if (doc === false) return <ErrorState message={error || 'Documento no disponible.'} />;

    const alumnoPk = doc.alumno_id;
    const nombreAlumno = doc.alumno?.nombre_completo
        ?? [doc.alumno?.nombre, doc.alumno?.primer_apellido, doc.alumno?.segundo_apellido].filter(Boolean).join(' ');

    return (
        <section className="grid gap-4">
            <PageHeader
                title={`Captura certificación #${doc.id}`}
                subtitle={nombreAlumno ? `${nombreAlumno} · ${doc.alumno?.curp ?? ''}` : 'Documento académico institucional'}
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <Link to={`/app/documentos/${documentoId}`} className="inst-btn inst-btn-secondary text-sm">
                            Ver detalle
                        </Link>
                        {alumnoPk ? (
                            <Link to={`/app/alumnos/${alumnoPk}/expediente`} className="inst-btn inst-btn-secondary text-sm">
                                Expediente 360°
                            </Link>
                        ) : null}
                    </div>
                )}
            />

            <Stepper steps={STEPS} currentStep={pasoActual} />

            <SectionCard title="Estado del documento">
                <div className="flex flex-wrap items-center gap-3">
                    <EstadoBadge estado={doc.estado_workflow} />
                    <span className="text-sm text-slate-600">
                        Tipo: {doc.tipo_documento} · Certificación: {doc.tipo_certificacion ?? '—'}
                    </span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                    Matrícula ID: {doc.matricula?.matricula ?? doc.matricula_id} · Institución: {doc.institucion?.nombre ?? doc.institucion_id}
                    {' · '}Sede/CCT: {doc.sede?.clave ?? doc.sede_id}
                </p>
            </SectionCard>

            <SectionCard title="Completar expediente antes de enviar">
                <ul className="grid gap-2 text-sm">
                    <li>
                        <Link className="text-blue-700 underline" to={`/app/materias-cursadas?alumno=${alumnoPk}`}>
                            Capturar o revisar materias y calificaciones
                        </Link>
                    </li>
                    <li>
                        <Link className="text-blue-700 underline" to={`/app/alumnos/${alumnoPk}/trayectoria`}>
                            Revisar trayectoria académica
                        </Link>
                    </li>
                    <li>
                        <Link className="text-blue-700 underline" to={`/app/documentos/${documentoId}/observaciones`}>
                            Atender observaciones ({doc.observaciones_pendientes_count ?? 0} pendientes)
                        </Link>
                    </li>
                </ul>
            </SectionCard>

            <ValidationSummary
                ok={Boolean(validacion?.valido)}
                errores={validacion?.errores ?? []}
                advertencias={validacion?.resumen?.advertencias ?? []}
            />

            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}

            <SectionCard title="Acciones de captura">
                <div className="flex flex-wrap gap-2">
                    <ActionButton variant="secondary" disabled={busy} onClick={() => void ejecutar('validar')}>
                        {busy ? 'Procesando…' : 'Validar expediente'}
                    </ActionButton>
                    {canEditar && doc.estado_workflow === 'borrador' ? (
                        <ActionButton variant="secondary" disabled={busy || !validacion?.valido} onClick={() => void ejecutar('pendiente')}>
                            Marcar pendiente de envío
                        </ActionButton>
                    ) : null}
                    {canEnviar ? (
                        <ActionButton
                            disabled={busy || bloqueosEnvio.length > 0}
                            onClick={() => void ejecutar('enviar')}
                        >
                            Enviar a revisión institucional
                        </ActionButton>
                    ) : null}
                </div>
                {bloqueosEnvio.length > 0 && canEnviar ? (
                    <p className="text-xs text-amber-700 mt-2">{bloqueosEnvio.join(' ')}</p>
                ) : null}
            </SectionCard>
        </section>
    );
}

export function DocumentoWizardPage() {
    const { id } = useParams();
    if (!id) {
        return <CapturaIndice />;
    }
    return <CapturaDocumento documentoId={id} />;
}
