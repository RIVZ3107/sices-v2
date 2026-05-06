import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { catalogosApi } from '../../api/catalogos';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { materiasCursadasApi } from '../../api/materiasCursadas';
import { matriculasApi } from '../../api/matriculas';
import { trayectoriasApi } from '../../api/trayectorias';
import { AlertBox } from '../../components/ui/AlertBox';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { Stepper } from '../../components/ui/Stepper';

const steps = [
    'Contexto',
    'Alumno',
    'Matricula',
    'Materias',
    'Trayectoria',
    'Documento',
    'Revision',
];

const STEP_HELP = {
    0: 'Define datos institucionales base para el documento.',
    1: 'Registra o vincula al alumno del proceso.',
    2: 'Registra la matricula academica correspondiente.',
    3: 'Carga materias y calificaciones del ciclo.',
    4: 'Consolida la trayectoria academica.',
    5: 'Crea el documento academico oficial interno.',
    6: 'Valida y envia a revision institucional.',
};

export function DocumentoWizardPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [isDocumentoPrevalidado, setIsDocumentoPrevalidado] = useState(false);
    const [state, setState] = useState({
        subsistema_id: '',
        region_id: '',
        institucion_id: '',
        sede_id: '',
        oferta_academica_id: '',
        ciclo_escolar_id: '',
        alumno_id: '',
        matricula_id: '',
        documento_id: id ?? '',
    });

    const canBack = step > 0;
    const canNext = step < steps.length - 1;
    const currentDocumentoId = state.documento_id;

    const hint = useMemo(() => (currentDocumentoId ? `Documento actual: ${currentDocumentoId}` : 'Aun no hay documento creado.'), [currentDocumentoId]);
    const requiredContext = ['subsistema_id', 'region_id', 'institucion_id', 'sede_id', 'oferta_academica_id', 'ciclo_escolar_id'];
    const hasContext = requiredContext.every((f) => Number(state[f]) > 0);
    const canRunStep = useMemo(() => {
        if (step === 0) return true;
        if (step === 1) return hasContext;
        if (step === 2) return hasContext && Number(state.alumno_id) > 0;
        if (step === 3) return Number(state.matricula_id) > 0 && Number(state.alumno_id) > 0;
        if (step === 4) return Number(state.matricula_id) > 0 && Number(state.alumno_id) > 0;
        if (step === 5) return hasContext && Number(state.alumno_id) > 0 && Number(state.matricula_id) > 0 && isDocumentoPrevalidado;
        if (step === 6) return Number(currentDocumentoId) > 0;
        return false;
    }, [currentDocumentoId, hasContext, isDocumentoPrevalidado, state.alumno_id, state.matricula_id, step]);

    function updateField(field, value) {
        setState((s) => ({ ...s, [field]: value }));
        if (['subsistema_id', 'region_id', 'institucion_id', 'sede_id', 'oferta_academica_id', 'ciclo_escolar_id', 'alumno_id', 'matricula_id'].includes(field)) {
            setIsDocumentoPrevalidado(false);
        }
    }

    async function runStepAction() {
        setBusy(true);
        setMsg('');
        try {
            if (step === 0) {
                await Promise.all([
                    catalogosApi.subsistemas(),
                    catalogosApi.ciclosEscolares(),
                    catalogosApi.instituciones(),
                ]);
                setMsg('Contexto consultado.');
            }
            if (step === 1) {
                const res = await alumnosApi.create({
                    // CURP de pruebas operativas (18 chars) para no romper validación backend.
                    curp: 'XAXX010101HNEXXXA4',
                    nombre: 'Alumno',
                    primer_apellido: 'Wizard',
                    segundo_apellido: 'Sices',
                });
                setState((s) => ({ ...s, alumno_id: res.data.id }));
                setIsDocumentoPrevalidado(false);
                setMsg(`Alumno creado: ${res.data.id}`);
            }
            if (step === 2) {
                const res = await matriculasApi.create({
                    alumno_id: Number(state.alumno_id),
                    oferta_academica_id: Number(state.oferta_academica_id),
                    ciclo_escolar_id: Number(state.ciclo_escolar_id),
                    matricula: `WIZ-${Date.now()}`,
                    estado: 'activa',
                });
                setState((s) => ({ ...s, matricula_id: res.data.id }));
                setIsDocumentoPrevalidado(false);
                setMsg(`Matricula creada: ${res.data.id}`);
            }
            if (step === 3) {
                await materiasCursadasApi.create({
                    alumno_id: Number(state.alumno_id),
                    matricula_id: Number(state.matricula_id),
                    ciclo_escolar_id: Number(state.ciclo_escolar_id),
                    clave: 'WIZ101',
                    nombre: 'Materia Wizard',
                    calificacion: 8,
                    creditos: 6,
                    semestre: 1,
                });
                setIsDocumentoPrevalidado(false);
                setMsg('Materia registrada. Requiere sincronizar trayectoria antes de crear documento.');
            }
            if (step === 4) {
                await trayectoriasApi.upsert({
                    alumno_id: Number(state.alumno_id),
                    matricula_id: Number(state.matricula_id),
                    promedio: 8,
                    total_materias: 1,
                    materias_aprobadas: 1,
                    estado: 'activa',
                });
                setIsDocumentoPrevalidado(true);
                setMsg('Trayectoria sincronizada. Ya puedes crear documento.');
            }
            if (step === 5) {
                const res = await documentosAcademicosApi.create({
                    alumno_id: Number(state.alumno_id),
                    matricula_id: Number(state.matricula_id),
                    ciclo_escolar_id: Number(state.ciclo_escolar_id),
                    subsistema_id: Number(state.subsistema_id),
                    region_id: Number(state.region_id),
                    institucion_id: Number(state.institucion_id),
                    sede_id: Number(state.sede_id),
                    tipo_documento: 'certificado',
                    tipo_certificacion: 'total',
                });
                setState((s) => ({ ...s, documento_id: res.data.id }));
                setMsg(`Documento creado: ${res.data.id}`);
            }
            if (step === 6 && currentDocumentoId) {
                const val = await documentosAcademicosApi.validar(currentDocumentoId);
                if (!val?.data?.valido) {
                    const detalle = (val?.data?.errores ?? []).join(' | ');
                    setMsg(`No se puede enviar a revision: ${detalle || 'faltan requisitos academicos.'}`);
                    return;
                }
                await documentosAcademicosApi.enviarRevision(currentDocumentoId, {});
                setMsg('Documento validado y enviado a revision.');
            }
        } catch (err) {
            const detalles = err?.errors ? Object.values(err.errors).flat().join(' | ') : '';
            setMsg(detalles || err?.message || 'Operacion no completada.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Wizard de captura documental" subtitle="Flujo guiado para crear, validar y enviar documentos academicos." />
            <SectionCard title="Progreso del proceso" subtitle={hint}>
                <Stepper steps={steps} currentStep={step} />
                <div className="mt-3 h-2 overflow-hidden rounded bg-slate-100">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                </div>
            </SectionCard>
            <SectionCard title={`Paso ${step + 1}: ${steps[step]}`} subtitle="Completa la captura y guarda para continuar.">
                <p className="mb-3 text-sm text-slate-600">{STEP_HELP[step]}</p>
                <div className="grid gap-2 md:grid-cols-3">
                    {['subsistema_id', 'region_id', 'institucion_id', 'sede_id', 'oferta_academica_id', 'ciclo_escolar_id'].map((f) => (
                        <input
                            key={f}
                            className="inst-input text-sm"
                            placeholder={f.replaceAll('_', ' ')}
                            value={state[f]}
                            onChange={(e) => updateField(f, e.target.value)}
                        />
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button disabled={!canBack || busy} onClick={() => setStep((s) => s - 1)} className="inst-btn inst-btn-secondary text-sm disabled:opacity-50">Anterior</button>
                    <button
                        disabled={busy || !canRunStep}
                        onClick={runStepAction}
                        className="inst-btn inst-btn-primary text-sm disabled:opacity-50"
                    >
                        {step === 6 ? 'Enviar a revision' : step === 5 ? 'Crear documento' : 'Guardar borrador del paso'}
                    </button>
                    <button disabled={!canNext || busy} onClick={() => setStep((s) => s + 1)} className="inst-btn inst-btn-secondary text-sm disabled:opacity-50">Siguiente</button>
                    {currentDocumentoId ? <button onClick={() => navigate(`/app/documentos/${currentDocumentoId}`)} className="inst-btn inst-btn-secondary text-sm">Ver documento</button> : null}
                </div>
                {msg ? <AlertBox message={msg} type="info" /> : null}
                {!canRunStep ? <p className="mt-2 text-xs text-amber-700">Completa los datos previos requeridos para este paso.</p> : null}
                {step === 5 && !isDocumentoPrevalidado ? (
                    <p className="mt-2 text-xs text-amber-700">
                        Documento deshabilitado hasta validar trayectoria sincronizada (ejecuta el paso de Trayectoria).
                    </p>
                ) : null}
            </SectionCard>
        </section>
    );
}
