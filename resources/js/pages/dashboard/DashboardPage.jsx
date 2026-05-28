import { Navigate } from 'react-router-dom';
import { getUser } from '../../authStore';
import { AdminDashboardPage } from '../admin/AdminDashboardPage';
import { AuditorDashboardPage } from '../auditoria/AuditorDashboardPage';
import { ConsultaDashboardPage } from '../consulta/ConsultaDashboardPage';
import { AlumnoEgresadoDashboardPage } from './AlumnoEgresadoDashboardPage';
import { AspiranteDashboardPage } from './AspiranteDashboardPage';
import { ControlEscolarDashboardPage } from './ControlEscolarDashboardPage';
import { CoordinadorAcademicoDashboardPage } from './CoordinadorAcademicoDashboardPage';
import { DirectorEscuelaDashboardPage } from './DirectorEscuelaDashboardPage';
import { DocenteDashboardPage } from './DocenteDashboardPage';
import { EducacionSuperiorDashboardPage } from './EducacionSuperiorDashboardPage';
import { ResponsableAdmisionDashboardPage } from './ResponsableAdmisionDashboardPage';
import { ResponsableCertificacionDashboardPage } from './ResponsableCertificacionDashboardPage';
import { ResponsableEvaluacionDashboardPage } from './ResponsableEvaluacionDashboardPage';
import { SistemasDashboardPage } from './SistemasDashboardPage';
import { SuperadminDashboardPage } from './SuperadminDashboardPage';

/** Debe coincidir con `App\Services\Dashboard\DashboardRoleResolver::PRIORITY`. */
const ROLE_PRIORITY = [
    'superadmin',
    'admin',
    'sistemas',
    'educacion_superior',
    'director_escuela',
    'control_escolar_escuela',
    'responsable_admision',
    'responsable_evaluacion',
    'responsable_certificacion_titulacion',
    'docente',
    'auditor',
    'consulta',
    'coordinador_academico',
    'alumno_egresado',
    'aspirante_preinscrito',
];

export function DashboardPage() {
    const userRoles = getUser()?.roles ?? [];
    const resolvedRole = ROLE_PRIORITY.find((role) => userRoles.includes(role)) || userRoles[0] || 'admin';

    if (resolvedRole === 'superadmin') return <SuperadminDashboardPage />;
    if (resolvedRole === 'admin') return <AdminDashboardPage />;
    if (resolvedRole === 'sistemas') return <SistemasDashboardPage />;
    if (resolvedRole === 'educacion_superior') {
        return <Navigate to="/app/educacion-superior/certificacion" replace />;
    }
    if (resolvedRole === 'director_escuela') return <DirectorEscuelaDashboardPage />;
    if (resolvedRole === 'control_escolar_escuela') return <ControlEscolarDashboardPage />;
    if (resolvedRole === 'responsable_admision') return <ResponsableAdmisionDashboardPage />;
    if (resolvedRole === 'responsable_evaluacion') return <ResponsableEvaluacionDashboardPage />;
    if (resolvedRole === 'responsable_certificacion_titulacion') {
        return <Navigate to="/app/certificacion/dashboard" replace />;
    }
    if (resolvedRole === 'docente') return <DocenteDashboardPage />;
    if (resolvedRole === 'auditor') return <AuditorDashboardPage />;
    if (resolvedRole === 'consulta') return <ConsultaDashboardPage />;
    if (resolvedRole === 'coordinador_academico') return <CoordinadorAcademicoDashboardPage />;
    if (resolvedRole === 'alumno_egresado') return <AlumnoEgresadoDashboardPage />;
    if (resolvedRole === 'aspirante_preinscrito') return <AspiranteDashboardPage />;

    return <AdminDashboardPage />;
}
