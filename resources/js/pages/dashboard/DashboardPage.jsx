import { getUser } from '../../authStore';
import { AdminDashboardPage } from '../admin/AdminDashboardPage';
import { AuditorDashboardPage } from '../auditoria/AuditorDashboardPage';
import { ConsultaDashboardPage } from '../consulta/ConsultaDashboardPage';
import { SuperAdminDashboardPage } from '../superadmin/SuperAdminDashboardPage';
import { ControlEscolarDashboardPage } from './ControlEscolarDashboardPage';
import { CoordinadorAcademicoDashboardPage } from './CoordinadorAcademicoDashboardPage';
import { DirectorEscuelaDashboardPage } from './DirectorEscuelaDashboardPage';
import { DocenteDashboardPage } from './DocenteDashboardPage';
import { EducacionSuperiorDashboardPage } from './EducacionSuperiorDashboardPage';
import { DashboardTecnicoPage } from '../sistemas/DashboardTecnicoPage';

const ROLE_PRIORITY = [
    'superadmin',
    'admin',
    'sistemas',
    'educacion_superior',
    'director_escuela',
    'control_escolar_escuela',
    'auditor',
    'consulta',
    'docente',
    'coordinador_academico',
];

export function DashboardPage() {
    const userRoles = getUser()?.roles ?? [];
    const resolvedRole = ROLE_PRIORITY.find((role) => userRoles.includes(role)) || userRoles[0] || 'admin';

    if (resolvedRole === 'superadmin') return <SuperAdminDashboardPage />;
    if (resolvedRole === 'admin') return <AdminDashboardPage />;
    if (resolvedRole === 'sistemas') return <DashboardTecnicoPage />;
    if (resolvedRole === 'educacion_superior') return <EducacionSuperiorDashboardPage />;
    if (resolvedRole === 'director_escuela') return <DirectorEscuelaDashboardPage />;
    if (resolvedRole === 'control_escolar_escuela') return <ControlEscolarDashboardPage />;
    if (resolvedRole === 'auditor') return <AuditorDashboardPage />;
    if (resolvedRole === 'consulta') return <ConsultaDashboardPage />;
    if (resolvedRole === 'docente') return <DocenteDashboardPage />;
    if (resolvedRole === 'coordinador_academico') return <CoordinadorAcademicoDashboardPage />;

    return <AdminDashboardPage />;
}
