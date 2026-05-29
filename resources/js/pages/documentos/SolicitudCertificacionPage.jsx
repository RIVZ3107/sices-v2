import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { alumnosApi } from '../../api/alumnos';

import { documentosAcademicosApi } from '../../api/documentosAcademicos';

import { ActionButton } from '../../components/ActionButton';

import { PageHeader } from '../../components/PageHeader';

import { AlertBox } from '../../components/ui/AlertBox';

import { InstitutionalEmptyState } from '../../components/ui/InstitutionalEmptyState';

import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';

import { UX_COPY, sanitizeInstitutionalMessage } from '../../utils/uxInstitucional';

import { SectionCard } from '../../components/ui/SectionCard';

import { FormField } from '../../components/FormField';

import { SolicitudChecklistInstitucional } from '../../components/documentos/SolicitudChecklistInstitucional';

import { SolicitudDocumentalStepper } from '../../components/documentos/SolicitudDocumentalStepper';

import { AlumnoSeleccionCard, ExpedienteResumenCard } from '../../components/documentos/AlumnoSeleccionCard';

import {

    fetchTiposDocumentosAcademicos,

    labelTipoDocumento,

    normalizarSubsistemaCatalogo,

} from '../../utils/documentosAcademicosTipos';
import { userCanAny } from '../../utils/userPermissions';



const WORKFLOW_ACTIVOS = ['borrador', 'pendiente', 'en_revision', 'aprobado'];



function resolverTipoCertificacion(tipoKey) {

    if (tipoKey === 'certificacion_parcial') return 'parcial';

    return 'total';

}



function esErrorDuplicado(texto) {

    if (!texto) return false;

    return texto.includes('documento activo') || texto.includes('expediente antes de crear');

}



function nombreCompletoAlumno(a) {

    return [a?.nombre, a?.primer_apellido, a?.segundo_apellido].filter(Boolean).join(' ').trim();

}



function mapCandidatoBusqueda(a, resumen) {

    const m = resumen?.matricula;

    const al = resumen?.alumno;

    return {

        id: a.id,

        nombre_completo: al?.nombre_completo ?? nombreCompletoAlumno(a),

        curp: a.curp ?? al?.curp,

        matricula: m?.clave_matricula,

        institucion: m?.institucion,

        subsistema: m?.subsistema,

        programa: m?.programa,

        programa_plan: m?.programa && m?.plan_estudios ? `${m.programa}` : m?.programa,

        ciclo_escolar: m?.ciclo_actual,

        estatus: al?.estatus ?? m?.estado ?? a.estatus,

    };

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



    const [alumnoId, setAlumnoId] = useState(Number.isFinite(alumnoUrl) && alumnoUrl > 0 ? alumnoUrl : null);

    const [busqueda, setBusqueda] = useState('');

    const [candidatos, setCandidatos] = useState([]);

    const [buscando, setBuscando] = useState(false);

    const [busquedaRealizada, setBusquedaRealizada] = useState(false);

    const [busy, setBusy] = useState(false);

    const [avisoEnvio, setAvisoEnvio] = useState('');

    const [errorEnvio, setErrorEnvio] = useState('');

    const [intentadoEnviar, setIntentadoEnviar] = useState(false);



    const [tipoDocumento, setTipoDocumento] = useState('');

    const [tiposCatalogo, setTiposCatalogo] = useState([]);

    const [resumen, setResumen] = useState(null);



    const puedeRegistrarAlumno = userCanAny(['alumnos.crear', 'documentos.crear_borrador', 'crear_documentos']);



    useEffect(() => {

        if (Number.isFinite(alumnoUrl) && alumnoUrl > 0) {

            setAlumnoId(alumnoUrl);

        }

    }, [alumnoUrl]);



    const subsistemaClave = useMemo(() => {

        const raw =

            resumen?.matricula?.subsistema_clave

            ?? resumen?.refs?.subsistema_clave

            ?? resumen?.expediente_normativo?.subsistema_clave;

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

                setTipoDocumento(items[0].key);

            }

        });

        return () => {

            cancel = true;

        };

    }, [subsistemaClave, tipoDocumento]);



    const tipoEfectivo = tipoDocumento || '';

    const alumnoPk = alumnoId ?? 0;

    const tieneAlumno = alumnoPk > 0;



    const sinDuplicadoActivo = useMemo(() => {

        if (!tipoEfectivo || !resumen?.documentos_certificacion) return true;

        return !resumen.documentos_certificacion.some(

            (d) =>

                d.tipo_documento_key === tipoEfectivo

                && WORKFLOW_ACTIVOS.includes(d.estado_workflow),

        );

    }, [resumen, tipoEfectivo]);



    const checklistExpediente = useMemo(() => {

        const refs = resumen?.refs ?? {};

        const m = resumen?.matricula ?? {};

        const trayectoriaOk = Boolean(resumen?.trayectoria);

        const materiasOk = (resumen?.materias_cursadas ?? []).length > 0;

        const promedio = resumen?.trayectoria?.promedio ?? resumen?.trayectoria?.promedio_aprovechamiento;



        return [

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

                label: 'Programa identificado',

                ok: Boolean(m.programa),

                hint: 'Verifique la oferta académica del alumno.',

                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/expediente` : undefined,

                whereLabel: 'Revisar expediente',

            },

            {

                key: 'plan',

                label: 'Plan de estudios identificado',

                ok: Boolean(m.plan_estudios),

                hint: 'Asigne el plan de estudios en la matrícula.',

                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/expediente` : undefined,

                whereLabel: 'Revisar expediente',

            },

            {

                key: 'ciclo',

                label: 'Ciclo escolar',

                ok: Boolean(refs.ciclo_escolar_id ?? m.ciclo_actual),

                hint: 'Confirme el ciclo escolar de la matrícula.',

            },

            {

                key: 'trayectoria',

                label: 'Trayectoria académica',

                ok: trayectoriaOk,

                hint: 'Consolide la trayectoria antes de enviar.',

                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/trayectoria` : '/app/control-escolar/trayectoria',

                whereLabel: 'Ir a trayectoria',

            },

            {

                key: 'materias',

                label: 'Materias registradas',

                ok: materiasOk,

                hint: 'Capture las calificaciones y materias cursadas.',

                where: '/app/materias-cursadas',

                whereLabel: 'Ir a materias cursadas',

            },

            {

                key: 'promedio',

                label: 'Promedio registrado (si aplica)',

                ok: promedio == null || promedio === '' || Number(promedio) > 0,

                hint: 'Registre el promedio en la trayectoria cuando el tipo de documento lo requiera.',

                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/trayectoria` : undefined,

                whereLabel: 'Actualizar trayectoria',

            },

            {

                key: 'duplicado',

                label: 'Sin solicitud activa duplicada',

                ok: !tipoEfectivo || sinDuplicadoActivo,

                hint: 'Ya existe una solicitud activa de este tipo. Continúe desde el expediente.',

                where: tieneAlumno ? `/app/alumnos/${alumnoPk}/expediente` : undefined,

                whereLabel: 'Abrir expediente',

            },

        ];

    }, [resumen, tieneAlumno, alumnoPk, tipoEfectivo, sinDuplicadoActivo]);



    const expedienteListo = checklistExpediente.filter((i) => i.key !== 'duplicado').every((i) => i.ok);

    const checklistEnvio = useMemo(

        () => [

            ...checklistExpediente,

            {

                key: 'tipo',

                label: 'Tipo de solicitud seleccionado',

                ok: Boolean(tipoEfectivo) && tiposCatalogo.some((t) => t.key === tipoEfectivo),

                hint: 'Elija un tipo documental autorizado para el subsistema.',

            },

        ],

        [checklistExpediente, tipoEfectivo, tiposCatalogo],

    );



    const checklistListo = checklistEnvio.every((i) => i.ok);



    const pasoActivo = !tieneAlumno ? 1 : !tipoDocumento ? 2 : !checklistListo ? 3 : 4;



    async function buscarAlumnos() {

        const q = busqueda.trim();

        if (!q) return;

        setBuscando(true);

        setErrorEnvio('');

        setBusquedaRealizada(false);

        setCandidatos([]);

        try {

            const res = await alumnosApi.list({ q, curp: q, per_page: 8 });

            const data = res?.data?.data || res?.data || [];

            const lista = Array.isArray(data) ? data : [];

            const enriquecidos = await Promise.all(

                lista.slice(0, 8).map(async (a) => {

                    try {

                        const r = await alumnosApi.resumenInstitucional(a.id);

                        return { alumno: a, resumen: r?.data, vista: mapCandidatoBusqueda(a, r?.data) };

                    } catch {

                        return {

                            alumno: a,

                            resumen: null,

                            vista: mapCandidatoBusqueda(a, null),

                        };

                    }

                }),

            );

            setCandidatos(enriquecidos);

            setBusquedaRealizada(true);

        } catch (e) {

            setCandidatos([]);

            setBusquedaRealizada(true);

            setErrorEnvio(sanitizeInstitutionalMessage(e?.message, 'No fue posible buscar alumnos.'));

        } finally {

            setBuscando(false);

        }

    }



    function seleccionarAlumno(id) {

        setAlumnoId(id);

        setParams({ alumno: String(id) });

        setCandidatos([]);

        setBusquedaRealizada(false);

        setErrorEnvio('');

        setIntentadoEnviar(false);

        setAvisoEnvio('');

        setTipoDocumento('');

    }



    function cambiarAlumno() {

        setAlumnoId(null);

        setParams({});

        setResumen(null);

        setTipoDocumento('');

        setCandidatos([]);

        setBusquedaRealizada(false);

    }



    async function enviarAValidacion() {

        const r = resumen?.refs;

        setIntentadoEnviar(true);

        if (!r || !checklistListo || !tipoEfectivo) {

            return;

        }

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

                tipo_certificacion: resolverTipoCertificacion(tipoEfectivo),

            });

            const docId = creado?.data?.id;

            if (!docId) {

                setErrorEnvio('No se registró la solicitud. Intente de nuevo.');

                return;

            }



            const val = await documentosAcademicosApi.validar(docId);

            if (val?.data?.valido !== true) {

                const errs = val?.data?.errores ?? val?.data?.mensajes ?? [];

                const lista = Array.isArray(errs)

                    ? errs.join(' ')

                    : 'Complete los requisitos del expediente antes de enviar.';

                setErrorEnvio(sanitizeInstitutionalMessage(lista));

                navigate(`/app/documentos/${docId}/captura`);

                return;

            }



            await documentosAcademicosApi.enviarRevision(docId, {

                motivo: 'Solicitud documental iniciada por Control Escolar para revisión del certificador.',

            });



            setAvisoEnvio('La solicitud documental fue enviada al certificador para su revisión.');

            navigate('/app/documentos/bandejas/en-revision');

        } catch (e) {

            const det = e?.payload?.errors ?? e?.errors;

            if (det && typeof det === 'object') {

                setErrorEnvio(sanitizeInstitutionalMessage(Object.values(det).flat().join(' ')));

            } else {

                setErrorEnvio(sanitizeInstitutionalMessage(e?.message, 'No se pudo enviar la solicitud.'));

            }

        } finally {

            setBusy(false);

        }

    }



    const tipoSeleccionado = tiposCatalogo.find((t) => t.key === tipoDocumento);



    return (

        <section className="grid gap-4">

            <PageHeader

                title="Solicitud documental"

                subtitle="Inicie una solicitud documental para revisión del certificador. No genera el documento final."

                actions={

                    <Link className="inst-btn inst-btn-secondary text-sm" to="/app/control-escolar/documentos">

                        Volver a documentos

                    </Link>

                }

            />



            <InstitutionalRoleBanner message={UX_COPY.controlEscolar} />



            <SolicitudDocumentalStepper

                pasoActivo={pasoActivo}

                alumnoOk={tieneAlumno}

                expedienteOk={tieneAlumno && expedienteListo}

                tipoOk={Boolean(tipoDocumento)}

            />



            <Paso numero={1} titulo="Buscar alumno" activo={pasoActivo === 1} completado={tieneAlumno}>

                <p className="subtle-help-text" style={{ marginTop: 0 }}>

                    Busque por CURP, matrícula o nombre completo. Debe seleccionar un alumno antes de continuar.

                </p>

                <div className="grid gap-2 md:grid-cols-[1fr_auto]">

                    <FormField

                        label="Alumno"

                        value={busqueda}

                        onChange={setBusqueda}

                        placeholder="CURP, matrícula o nombre"

                    />

                    <div className="self-end">

                        <ActionButton onClick={() => void buscarAlumnos()} disabled={buscando || busy}>

                            {buscando ? 'Buscando…' : 'Buscar'}

                        </ActionButton>

                    </div>

                </div>



                {busquedaRealizada && candidatos.length === 0 ? (

                    <div style={{ marginTop: 16 }}>

                        <InstitutionalEmptyState

                            title="No se encontró el alumno en tu alcance."

                            description="Verifique la búsqueda o registre al alumno si corresponde a su institución."

                            action={

                                puedeRegistrarAlumno ? (

                                    <Link to="/app/alumnos/crear" className="inst-btn inst-btn-primary text-sm">

                                        Registrar alumno

                                    </Link>

                                ) : null

                            }

                        />

                    </div>

                ) : null}



                {candidatos.length > 0 ? (

                    <div className="grid gap-3 mt-3">

                        {candidatos.map(({ alumno: a, vista }) => (

                            <AlumnoSeleccionCard

                                key={a.id}

                                datos={vista}

                                busy={busy}

                                onSeleccionar={() => seleccionarAlumno(a.id)}

                            />

                        ))}

                    </div>

                ) : null}



                {tieneAlumno && candidatos.length === 0 ? (

                    <div style={{ marginTop: 12 }}>

                        <button type="button" className="inst-btn inst-btn-secondary text-sm" onClick={cambiarAlumno}>

                            Cambiar alumno

                        </button>

                    </div>

                ) : null}

            </Paso>



            {tieneAlumno ? (

                <Paso

                    numero={2}

                    titulo="Confirmar expediente"

                    activo={pasoActivo === 2}

                    completado={expedienteListo}

                >

                    <p className="subtle-help-text" style={{ marginTop: 0 }}>

                        El sistema valida automáticamente la información escolar. Revise el checklist antes de elegir el

                        tipo de solicitud.

                    </p>

                    {busy && !resumen ? (

                        <p style={{ fontSize: 13, color: '#64748b' }}>Cargando expediente del alumno…</p>

                    ) : (

                        <ExpedienteResumenCard resumen={resumen} />

                    )}

                    <div style={{ marginTop: 16 }}>

                        <SolicitudChecklistInstitucional items={checklistExpediente} />

                    </div>

                </Paso>

            ) : null}



            {tieneAlumno && expedienteListo ? (

                <Paso numero={3} titulo="Tipo de solicitud" activo={pasoActivo === 3} completado={Boolean(tipoDocumento)}>

                    <p className="subtle-help-text" style={{ marginTop: 0 }}>

                        Solo se muestran tipos documentales autorizados según subsistema, institución, programa y plan del

                        alumno.

                    </p>

                    {tiposCatalogo.length === 0 ? (

                        <InstitutionalEmptyState

                            title="No hay tipos documentales disponibles"

                            description="No se encontraron solicitudes permitidas para el contexto académico de este alumno."

                        />

                    ) : (

                        <div className="grid gap-3 text-sm">

                            <label className="grid gap-1">

                                <span className="font-medium">Tipo de solicitud documental</span>

                                <select

                                    className="inst-select"

                                    value={tipoDocumento}

                                    onChange={(e) => {

                                        setTipoDocumento(e.target.value);

                                        setIntentadoEnviar(false);

                                        setErrorEnvio('');

                                    }}

                                >

                                    <option value="">Seleccione…</option>

                                    {tiposCatalogo.map((t) => (

                                        <option key={t.key} value={t.key}>

                                            {t.label ?? labelTipoDocumento(t.key)}

                                        </option>

                                    ))}

                                </select>

                            </label>

                            {tipoSeleccionado?.descripcion ? (

                                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{tipoSeleccionado.descripcion}</p>

                            ) : null}

                            {!sinDuplicadoActivo && tipoDocumento ? (

                                <AlertBox

                                    type="warning"

                                    message="Ya existe una solicitud activa de este tipo para el alumno. Consulte el expediente antes de continuar."

                                />

                            ) : null}

                        </div>

                    )}

                </Paso>

            ) : null}



            {tieneAlumno && tipoDocumento && sinDuplicadoActivo ? (

                <Paso numero={4} titulo="Enviar a validación" activo={pasoActivo === 4} completado={false}>

                    <p className="text-sm text-slate-600" style={{ marginTop: 0 }}>

                        Control Escolar inicia la solicitud documental. El Certificador revisará la información académica

                        antes de continuar el proceso institucional.

                    </p>

                    {intentadoEnviar && !checklistListo ? (

                        <AlertBox

                            type="info"

                            message="Complete los puntos pendientes del expediente antes de enviar la solicitud."

                        />

                    ) : null}

                    {errorEnvio ? (

                        <AlertBox

                            type={esErrorDuplicado(errorEnvio) ? 'warning' : 'danger'}

                            message={

                                esErrorDuplicado(errorEnvio)

                                    ? 'Ya existe una solicitud documental activa para este alumno. Abra el expediente para continuar.'

                                    : errorEnvio

                            }

                        />

                    ) : null}

                    {avisoEnvio ? <AlertBox type="success" message={avisoEnvio} /> : null}

                    <div className="flex flex-wrap gap-2 mt-3">

                        <ActionButton disabled={busy || !checklistListo} onClick={() => void enviarAValidacion()}>

                            {busy ? 'Enviando…' : 'Enviar a validación del certificador'}

                        </ActionButton>

                        <Link className="inst-btn inst-btn-secondary text-sm" to={`/app/alumnos/${alumnoPk}/expediente`}>

                            Ver expediente

                        </Link>

                    </div>

                </Paso>

            ) : null}

        </section>

    );

}


