import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { Stepper } from '../../components/ui/Stepper';

const steps = [
    'Contexto institucional',
    'Expediente del alumno',
    'Matrícula e inscripción',
    'Materias y calificaciones',
    'Trayectoria académica',
    'Solicitud de certificación',
];

const STEP_HELP = {
    0: 'Validar subsistema, institución, sede/CCT y ciclo escolar activo.',
    1: 'Abrir expediente 360° del alumno y validar datos personales.',
    2: 'Confirmar matrícula activa e inscripción del periodo.',
    3: 'Capturar o importar calificaciones sobre carga académica.',
    4: 'Recalcular trayectoria y validar bloqueos.',
    5: 'Generar solicitud de certificación para seguimiento.',
};

export function DocumentoWizardPage() {
    return (
        <section className="grid gap-4">
            <PageHeader title="Captura académica guiada" subtitle="Preparación de expediente académico para solicitud institucional." />
            <SectionCard title="Ruta recomendada de trabajo" subtitle="Flujo único para evitar duplicidad y errores operativos.">
                <Stepper steps={steps} currentStep={0} />
                <p className="subtle-help-text mt-3">
                    Esta vista organiza el proceso y redirige a los módulos oficiales de captura.
                </p>
            </SectionCard>
            <SectionCard title="Instrucciones claras" subtitle="Ejecute los módulos en este orden para garantizar una solicitud válida.">
                <div className="grid gap-3 md:grid-cols-2">
                    {steps.map((label, idx) => (
                        <article key={label} className="action-card">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Paso {idx + 1}</p>
                            <p className="text-sm font-semibold text-slate-900">{label}</p>
                            <p className="text-xs text-slate-600 mt-1">{STEP_HELP[idx]}</p>
                        </article>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/app/alumnos/captura-guiado" className="inst-btn inst-btn-primary text-sm">Ir a captura guiada</Link>
                    <Link to="/app/alumnos" className="inst-btn inst-btn-secondary text-sm">Abrir alumnos</Link>
                    <Link to="/app/matriculas" className="inst-btn inst-btn-secondary text-sm">Abrir matrículas</Link>
                    <Link to="/app/materias-cursadas" className="inst-btn inst-btn-secondary text-sm">Abrir materias/calificaciones</Link>
                    <Link to="/app/trayectorias" className="inst-btn inst-btn-secondary text-sm">Abrir trayectorias</Link>
                    <Link to="/app/certificacion/solicitud" className="inst-btn inst-btn-success text-sm">Ir a solicitud de certificación</Link>
                </div>
            </SectionCard>
        </section>
    );
}
