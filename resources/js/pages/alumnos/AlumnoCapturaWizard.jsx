import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StepWizard } from '../../components/academic/StepWizard';
import { PageHeader } from '../../components/PageHeader';

const STEPS_CAPTURA = [
    'Alumno · registro y actualización',
    'Matrícula · alta institucional',
    'Inscripción por periodo',
    'Carga académica desde plan',
    'Calificaciones · captura o importación',
    'Trayectoria · recálculo y revisión',
    'Certificación · solicitud institucional',
];

const ROUTES_ACCIONES = [
    { href: '/app/alumnos/crear', label: '1) Registrar o editar alumno' },
    { href: '/app/matriculas', label: '2) Crear matrícula' },
    { href: '/app/materias-cursadas', label: '3) Registrar inscripción por periodo' },
    { href: '/app/materias-cursadas', label: '4) Generar carga académica' },
    { href: '/app/importaciones', label: '5) Capturar o importar calificaciones' },
    { href: '/app/trayectorias', label: '6) Recalcular y revisar trayectoria' },
    { href: '/app/certificacion/solicitud', label: '7) Solicitar certificado' },
];

export function AlumnoCapturaWizard() {
    const { id } = useParams();
    const alumno = id ? Number(id) : NaN;
    const current = useMemo(() => (Number.isFinite(alumno) && alumno > 0 ? 1 : 0), [alumno]);

    const aviso = [];
    if (Number.isFinite(alumno)) {
        aviso.push('Continúe en cada apartado usando los accesos directos; esta pantalla sólo ordena la operación institucional.');
    } else {
        aviso.push('Comience desde el alta de alumno hasta la solicitud de certificación usando las pestañas de la izquierda y los accesos de abajo.');
    }

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Captura académica guiada"
                subtitle="Flujo operativo por etapas para Control Escolar: sin campos técnicos ni captura de identificadores internos."
                actions={
                    Number.isFinite(alumno) ? (
                        <Link className="inst-btn inst-btn-primary text-sm" to={`/app/alumnos/${alumno}/expediente`}>
                            Abrir expediente 360°
                        </Link>
                    ) : null
                }
            />
            <StepWizard
                steps={STEPS_CAPTURA}
                currentStep={current}
                stepSubtitle="Paso 1 · Contexto escolar: Subsistema, Región, Institución, Sede/CCT, Programa/Plan y Ciclo escolar se toman desde catálogos y contexto institucional."
                errors={[]}
                warnings={['Utilice lenguaje institucional y selecciones de catálogo; no capture IDs técnicos.', ...aviso]}
            >
                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                    {ROUTES_ACCIONES.map((r) => (
                        <Link key={r.href} to={Number.isFinite(alumno) && r.href === '/app/certificacion/solicitud' ? `${r.href}?alumno=${alumno}` : r.href} className="rounded-lg border border-slate-200 px-4 py-3 text-sm hover:border-slate-400">
                            {r.label}
                        </Link>
                    ))}
                </div>
            </StepWizard>
        </section>
    );
}
