import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { ActionButton } from '../../components/ActionButton';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
import { InstitutionalEmptyState } from '../../components/ui/InstitutionalEmptyState';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';
import { UX_COPY } from '../../utils/uxInstitucional';
import { SectionCard } from '../../components/ui/SectionCard';
import { FormField } from '../../components/FormField';
import { SolicitudChecklistInstitucional } from '../../components/documentos/SolicitudChecklistInstitucional';
import {
    fetchTiposDocumentosAcademicos,
    labelTipoDocumento,
    normalizarSubsistemaCatalogo,
} from '../../utils/documentosAcademicosTipos';

function resolverTipoDocumentalCatalogo(tipoCert, tipoDocumentoSeleccionado) {
    if (tipoDocumentoSeleccionado) return tipoDocumentoSeleccionado;
    if (tipoCert === 'parcial') return 'certificacion_parcial';
    return 'certificado';
}

function esErrorDuplicado(texto) {
    if (!texto) return false;
    return texto.includes('documento activo') || texto.includes('expediente antes de crear');
}

function Paso({ numero, titulo, activo, completado, children }) {
    const badgeBg = completado ? '#0F6E56' : activo ? '#185FA5' : '#e2e8f0';
    const badgeColor = completado || activo ? '#fff' : '#64748b';

    return (
        <SectionCard title={`Paso ${numero} — ${titulo}`}>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        marginRight: 8,
                        borderRadius: '50%',
                        fontWeight: 700,
                        background: badgeBg,
                        color: badgeColor,
                    }}
                >
                    {completado ? '✓' : numero}
                </span>
                {completado ? 'Completado' : activo ? 'En curso' : 'Pendiente'}
            </p>
            {children}
        </SectionCard>
    );
}

export function SolicitudCertificacionPage() {
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const alumnoUrl = Number(params.get('alumno') ?? '');
    const tipoIni = params.get('tipo') === 'parcial' ? 'parcial' : 'termino';

    const [alumnoId, setAlumnoId] = useState(Number.isFinite(alumnoUrl) && alumnoUrl > 0 ? alumnoUrl : null);
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [busy, setBusy] = useState(false);
    const [avisoEnvio, setAvisoEnvio] = useState('');
    const [errorEnvio, setErrorEnvio] = useState('');
    const [intentadoEnviar, setIntentadoEnviar] = useState(false);

    const [tipoCert, setTipoCert] = useState(tipoIni);
    const [tipoDocumento, setTipoDocumento] = useState('');
    const [tiposCatalogo, setTiposCatalogo] = useState([]);
    const [resumen, setResumen] = useState(null);

    useEffect(() => {
        if (Number.isFinite(alumnoUrl) && alumnoUrl > 0) {
            setAlumnoId(alumnoUrl);
        }
    }, [alumnoUrl]);

    const subsistemaClave = useMemo(() => {
        const raw = resumen?.matricula?.subsistema_clave ?? resumen?.refs?.subsistema_clave ?? resumen?.matricula?.subsistema;
        return normalizarSubsistemaCatalogo(raw);
    }, [resumen]);

    const cargarResumen = useCallback(async (pk) => {
        if (!Number.isFinite(pk) || pk <= 0) {
            setResumen(null);
            return;
        }
        setBusy(true);
        try {
            const r = await alumnosApi.resumenInstitucional(pk);
            setResumen(r?.data ?? null);
        } catch {
            setResumen(null);
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        if (alumnoId) void cargarResumen(alumnoId);
        else setResumen(null);
    }, [alumnoId, cargarResumen]);

    useEffect(() => {
        if (!subsistemaClave) {
            setTiposCatalogo([]);
            return;
        }
        let cancel = false;
        void fetchTiposDocumentosAcademicos(subsistemaClave).then((items) => {
            if (cancel) return;
            setTiposCatalogo(items);
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
    const alumnoPk = alumnoId ?? 0;
    const tieneAlumno = alumnoPk > 0;

    const tipoPermitido =
        !tipoEfectivo || !tiposCatalogo.length || tiposCatalogo.some((t) => t.key === tipoEfectivo);

    const checklistItems = useMemo(() => {
        const refs = resumen?.refs ?? {};
        const trayectoriaOk = Boolean(resumen?.trayectoria);
        const materiasOk = (resumen?.materias_cursadas ?? []).length > 0;
        const planOk = Boolean(resumen?.matricula?.plan_estudios);
        const legacyOk = !Boolean(resumen?.contexto_legacy_normativo?.requiere_atencion);

        return [
            {
                key: 'alumno',
                label: 'Alumno localizado',
                ok: tieneAlumno && Boolean(resumen?.alumno),
                hint: 'Busque al alumno por CURP, matrícula o nombre.',
                where: '/app/control-escolar/alumnos',
                whereLabel: 'Ir al listado de alumnos',
            },
            {
                key: 'matricula',
                label: 'Matrícula vigente',
                ok: Boolean(refs.matricula_id),
                hint: 'Registre o active la matrícula del alumno en su escuela.',
                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/captura-guiado` : '/app/control-escolar/alumnos',
                whereLabel: 'Completar matrícula',
            },
            {
                key: 'programa',
                label: 'Programa y plan identificados',
                ok: planOk && Boolean(subsistemaClave),
                hint: 'Verifique la oferta académica y el plan asociado a la matrícula.',
                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/expediente` : undefined,
                whereLabel: 'Revisar expediente',
            },
            {
                key: 'trayectoria',
                label: 'Trayectoria académica disponible',
                ok: trayectoriaOk,
                hint: 'Consolide la trayectoria antes de enviar a revisión.',
                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/trayectoria` : '/app/control-escolar/trayectoria',
                whereLabel: 'Ir a trayectoria',
            },
            {
                key: 'materias',
                label: 'Materias registradas',
                ok: materiasOk,
                hint: 'Capture las calificaciones y materias cursadas del alumno.',
                where: '/app/materias-cursadas',
                whereLabel: 'Ir a materias cursadas',
            },
            {
                key: 'tipo',
                label: 'Tipo de solicitud permitido',
                ok: Boolean(tipoEfectivo) && tipoPermitido,
                hint: 'Seleccione un tipo de solicitud autorizado para el subsistema del alumno.',
            },
            {
                key: 'normativa',
                label: 'Sin bloqueos normativos pendientes',
                ok: legacyOk,
                hint: resumen?.contexto_legacy_normativo?.mensaje_operativo ?? 'Regularice con Educación Superior.',
                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/expediente` : undefined,
                whereLabel: 'Ver expediente',
            },
            {
                key: 'duplicado',
                label: 'Sin solicitud activa duplicada',
                ok: !intentadoEnviar || !esErrorDuplicado(errorEnvio),
                hint: 'Ya existe una solicitud activa. Continúe desde el expediente.',
                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/expediente` : undefined,
                whereLabel: 'Abrir expediente',
            },
        ];
    }, [resumen, tieneAlumno, alumnoPk, subsistemaClave, tipoEfectivo, tipoPermitido, intentadoEnviar, errorEnvio]);

    const checklistListo = checklistItems.every((i) => i.ok);

    async function buscarAlumnos() {
        const q = busqueda.trim();
        if (!q) return;
        setBuscando(true);
        setErrorEnvio('');
        try {
            const res = await alumnosApi.list({ q, curp: q });
            const data = res?.data?.data || res?.data || [];
            setResultados(Array.isArray(data) ? data : []);
        } catch (e) {
            setResultados([]);
            setErrorEnvio(e?.message ?? 'No fue posible buscar alumnos.');
        } finally {
            setBuscando(false);
        }
    }

    function seleccionarAlumno(id) {
        setAlumnoId(id);
        setParams({ alumno: String(id), ...(tipoIni === 'parcial' ? { tipo: 'parcial' } : {}) });
        setResultados([]);
        setErrorEnvio('');
        setIntentadoEnviar(false);
        setAvisoEnvio('');
    }

    async function enviarAValidacion() {
        const r = resumen?.refs;
        if (!r || !checklistListo) {
            setIntentadoEnviar(true);
            return;
        }
        setIntentadoEnviar(true);
        setBusy(true);
        setErrorEnvio('');
        setAvisoEnvio('');
        try {
            const creado = await documentosAcademicosApi.create({
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
            const docId = creado?.data?.id;
            if (!docId) {
                setErrorEnvio('No se registró la solicitud. Intente de nuevo.');
                return;
            }

            const val = await documentosAcademicosApi.validar(docId);
            if (val?.data?.valido !== true) {
                const errs = val?.data?.errores ?? val?.data?.mensajes ?? [];
                const lista = Array.isArray(errs) ? errs.join(' ') : 'Complete los requisitos del checklist antes de enviar.';
                setErrorEnvio(lista || 'Aún hay información pendiente por corregir.');
                navigate(`/app/documentos/${docId}/captura`);
                return;
            }

            await documentosAcademicosApi.enviarRevision(docId, {
                motivo: 'Solicitud iniciada por Control Escolar para revisión del certificador.',
            });

            setAvisoEnvio('La solicitud fue enviada al certificador para su revisión.');
            navigate('/app/documentos/bandejas/en-revision');
        } catch (e) {
            const det = e?.payload?.errors ?? e?.errors;
            if (det && typeof det === 'object') {
                setErrorEnvio(Object.values(det).flat().join(' '));
            } else {
                setErrorEnvio(e?.message ?? 'No se pudo enviar la solicitud.');
            }
        } finally {
            setBusy(false);
        }
    }

    const nombreAlumno = resumen?.alumno?.nombre_completo ?? '';

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Solicitud documental"
                subtitle="Flujo guiado para Control Escolar"
                actions={
                    <Link className="inst-btn inst-btn-secondary text-sm" to="/app/control-escolar/documentos">
                        Volver a documentos
                    </Link>
                }
            />

            <InstitutionalRoleBanner message={UX_COPY.controlEscolar} />

            {!tieneAlumno ? (
                <InstitutionalEmptyState
                    title="Selecciona un alumno para iniciar una solicitud documental."
                    description="Busca por CURP, matrícula o nombre completo en el paso 1."
                />
            ) : null}

            <Paso numero={1} titulo="Seleccionar alumno" activo={!tieneAlumno} completado={tieneAlumno}>
                <p className="subtle-help-text" style={{ marginTop: 0 }}>
                    Busca por CURP, matrícula o nombre completo.
                </p>
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <FormField
                        label="Alumno"
                        value={busqueda}
                        onChange={setBusqueda}
                        placeholder="CURP, matrícula o nombre"
                    />
                    <div className="self-end">
                        <ActionButton onClick={() => void buscarAlumnos()} disabled={buscando}>
                            {buscando ? 'Buscando…' : 'Buscar'}
                        </ActionButton>
                    </div>
                </div>
                {resultados.length > 0 ? (
                    <ul className="grid gap-2 mt-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {resultados.map((a) => (
                            <li key={a.id}>
                                <button
                                    type="button"
                                    className="w-full text-left rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                                    onClick={() => seleccionarAlumno(a.id)}
                                >
                                    <strong>
                                        {a.nombre} {a.primer_apellido} {a.segundo_apellido ?? ''}
                                    </strong>
                                    <span className="text-slate-500 ml-2">{a.curp}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
                {tieneAlumno && nombreAlumno ? (
                    <p className="text-sm mt-3" style={{ color: '#0F6E56', fontWeight: 600 }}>
                        Alumno seleccionado: {nombreAlumno}
                    </p>
                ) : null}
            </Paso>

            {tieneAlumno ? (
                <Paso numero={2} titulo="Seleccionar tipo de solicitud" activo={!tipoDocumento} completado={Boolean(tipoDocumento)}>
                    <p className="subtle-help-text" style={{ marginTop: 0 }}>
                        El sistema solo muestra solicitudes permitidas para el subsistema y plan académico del alumno.
                    </p>
                    <div className="grid gap-3 text-sm">
                        <label className="grid gap-1">
                            <span className="font-medium">Tipo de solicitud</span>
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
                        <div className="grid gap-2">
                            <label className="flex gap-2 items-center">
                                <input type="radio" name="alcance" checked={tipoCert === 'termino'} onChange={() => setTipoCert('termino')} />
                                Certificado de terminación
                            </label>
                            <label className="flex gap-2 items-center">
                                <input type="radio" name="alcance" checked={tipoCert === 'parcial'} onChange={() => setTipoCert('parcial')} />
                                Certificación parcial
                            </label>
                        </div>
                    </div>
                </Paso>
            ) : null}

            {tieneAlumno && tipoDocumento ? (
                <Paso numero={3} titulo="Validación previa" activo={!checklistListo} completado={checklistListo}>
                    <p className="subtle-help-text" style={{ marginTop: 0 }}>
                        Revise que la información escolar esté completa antes de enviar al certificador.
                    </p>
                    <SolicitudChecklistInstitucional items={checklistItems} />
                </Paso>
            ) : null}

            {tieneAlumno && tipoDocumento ? (
                <Paso numero={4} titulo="Enviar a validación" activo completado={false}>
                    <p className="text-sm text-slate-600" style={{ marginTop: 0 }}>
                        Control Escolar inicia la solicitud. El Certificador revisará la información antes de continuar el
                        proceso institucional.
                    </p>
                    {intentadoEnviar && !checklistListo ? (
                        <AlertBox
                            type="info"
                            message="Complete los puntos marcados como pendientes antes de enviar la solicitud."
                        />
                    ) : null}
                    {errorEnvio ? (
                        <AlertBox
                            type={esErrorDuplicado(errorEnvio) ? 'warning' : 'danger'}
                            message={
                                esErrorDuplicado(errorEnvio)
                                    ? 'Ya existe una solicitud/documento activo para este alumno. Abra el expediente para continuar.'
                                    : errorEnvio
                            }
                        />
                    ) : null}
                    {avisoEnvio ? <AlertBox type="success" message={avisoEnvio} /> : null}
                    <div className="flex flex-wrap gap-2 mt-3">
                        <ActionButton disabled={busy} onClick={() => void enviarAValidacion()}>
                            {busy ? 'Enviando…' : 'Enviar a validación del certificador'}
                        </ActionButton>
                        {tieneAlumno ? (
                            <Link className="inst-btn inst-btn-secondary text-sm" to={`/app/alumnos/${alumnoPk}/expediente`}>
                                Ver expediente
                            </Link>
                        ) : null}
                    </div>
                </Paso>
            ) : null}
        </section>
    );
}
