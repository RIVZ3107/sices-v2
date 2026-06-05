<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

/**
 * Menús dinámicos por rol/permiso. Idempotente: reemplaza menús si ya existían.
 */
class SystemMenusSeeder extends Seeder
{
    public function run(): void
    {
        Schema::withoutForeignKeyConstraints(function (): void {
            DB::table('menu_permission')->delete();
            DB::table('menu_role')->delete();
            DB::table('menus')->delete();
        });

        $roleIds = Role::query()->where('guard_name', 'web')->pluck('id', 'name');

        $attach = function (Menu $menu, array $roleNames) use ($roleIds): void {
            $ids = [];
            foreach ($roleNames as $name) {
                $id = $roleIds[$name] ?? null;
                if ($id !== null) {
                    $ids[] = (int) $id;
                }
            }
            $menu->roles()->sync($ids);
        };

        /** @var array<string, Menu> $ref */
        $ref = [];

        $mk = function (
            ?string $parentKey,
            string $key,
            string $label,
            string $route,
            string $icon,
            int $order,
            string $section,
            ?string $permission,
            array $roles,
            array $metadata = [],
        ) use (&$ref, $attach): Menu {
            $parentId = null;
            if ($parentKey !== null && isset($ref[$parentKey])) {
                $parentId = $ref[$parentKey]->id;
            }

            $menu = Menu::query()->create([
                'parent_id' => $parentId,
                'label' => $label,
                'route' => $route,
                'icon' => $icon,
                'order' => $order,
                'section' => $section,
                'is_active' => true,
                'permission_name' => $permission,
                'metadata' => $metadata === [] ? null : $metadata,
            ]);
            $attach($menu, $roles);
            $ref[$key] = $menu;

            return $menu;
        };

        // ——— Superadmin / Admin (estructura amplia) ———
        $mk(null, 'sa_inicio', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['superadmin', 'admin']);
        $mk(null, 'sa_est', 'Estructura académica', '#', 'settings', 5, 'ESTRUCTURA', null, ['superadmin', 'admin'], ['group_heading' => true]);
        $mk('sa_est', 'sa_cat_acad', 'Catálogos académicos', '/app/catalogos-academicos', 'panel', 0, 'ESTRUCTURA', 'catalogos.academicos.ver', ['superadmin', 'admin']);
        $mk('sa_est', 'sa_sub', 'Subsistemas / Instituciones', '/app/catalogos/subsistemas-instituciones', 'settings', 1, 'ESTRUCTURA', 'catalogos.ver', ['superadmin', 'admin']);
        $mk('sa_est', 'sa_sedes', 'Sedes y subsedes', '/app/catalogos/sedes', 'settings', 2, 'ESTRUCTURA', 'sedes.ver', ['superadmin', 'admin']);
        $mk('sa_est', 'sa_ciclos', 'Ciclos y periodos', '/app/catalogos/ciclos-periodos', 'panel', 3, 'ESTRUCTURA', 'catalogos.academicos.ver', ['superadmin', 'admin']);
        $mk('sa_est', 'sa_mun', 'Municipios', '/app/catalogos/municipios', 'settings', 4, 'ESTRUCTURA', 'catalogos.ver', ['superadmin', 'admin']);
        $mk('sa_est', 'sa_prog', 'Programas y ofertas', '/app/catalogos/programas-ofertas', 'panel', 5, 'ESTRUCTURA', 'catalogos.ver', ['superadmin', 'admin']);
        $mk(null, 'sa_ce_grp', 'Control escolar', '#', 'matriculas', 7, 'CONTROL ESCOLAR', null, ['superadmin', 'admin'], ['group_heading' => true]);
        $mk('sa_ce_grp', 'sa_ce_config', 'Configuración académica', '/app/control-escolar/catalogos', 'settings', 8, 'CONTROL ESCOLAR', 'control_escolar.catalogos.configurar', ['superadmin', 'admin']);
        $mk(null, 'sa_sys', 'Sistema', '#', 'settings', 10, 'SISTEMA', null, ['superadmin', 'admin'], ['group_heading' => true]);
        $mk('sa_sys', 'sa_users', 'Usuarios', '/app/admin/usuarios-roles', 'users', 1, 'SISTEMA', 'usuarios.ver', ['superadmin', 'admin']);
        $mk('sa_sys', 'sa_roles', 'Roles y permisos', '/app/admin/usuarios-roles', 'users', 2, 'SISTEMA', 'roles.ver', ['superadmin', 'admin']);
        $mk('sa_sys', 'sa_menus', 'Menús del sistema', '/app/admin/menus', 'panel', 3, 'SISTEMA', 'menus.administrar', ['superadmin', 'admin']);
        $mk('sa_sys', 'sa_conf', 'Configuración', '/app/admin/parametros', 'settings', 4, 'SISTEMA', 'configuracion.ver', ['superadmin', 'admin']);
        $mk('sa_sys', 'sa_cat_tec', 'Catálogos técnicos', '/app/admin/catalogos', 'settings', 5, 'SISTEMA', 'catalogos.tecnicos.ver', ['superadmin']);
        $mk(null, 'sa_look', 'Apariencia del sistema', '/app/sistema/apariencia', 'settings', 13, 'SISTEMA', 'apariencia_sistema.administrar', ['superadmin', 'admin']);
        $mk(null, 'sa_aud', 'Auditoría', '/app/auditoria', 'audit', 30, 'OPERACION', 'auditoria.ver', ['superadmin', 'admin']);
        $mk(null, 'sa_rep', 'Reportes globales', '/app/admin/reportes-basicos', 'report', 31, 'OPERACION', 'reportes.ver', ['superadmin', 'admin']);
        $mk(null, 'sa_doc_conf', 'Configuración documental', '/app/admin/parametros', 'settings', 39, 'TECNICO', 'configuracion.configurar', ['superadmin'], ['technical_only' => true]);
        $mk(null, 'sa_int', 'Integraciones', '/app/sistemas/configuracion', 'integrations', 40, 'TECNICO', 'integraciones.ver', ['superadmin', 'admin'], ['technical_only' => true]);
        $mk(null, 'sa_logs', 'Logs técnicos', '/app/sistemas/logs', 'logs', 41, 'TECNICO', 'logs.ver', ['superadmin', 'admin'], ['technical_only' => true]);

        // ——— Sistemas ———
        $mk(null, 'sys_inicio', 'Inicio técnico', '/app/sistemas/proceso-tecnico-certificacion', 'home', 1, 'MAIN', 'cadena_original.generar', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_est', 'Estructura académica', '#', 'settings', 4, 'ESTRUCTURA', null, ['sistemas'], ['group_heading' => true]);
        $mk('sys_est', 'sys_est_cat', 'Catálogos académicos', '/app/catalogos-academicos', 'panel', 0, 'ESTRUCTURA', 'catalogos.academicos.ver', ['sistemas']);
        $mk('sys_est', 'sys_est_sub', 'Subsistemas / Instituciones', '/app/catalogos/subsistemas-instituciones', 'settings', 1, 'ESTRUCTURA', 'catalogos.ver', ['sistemas']);
        $mk('sys_est', 'sys_est_sedes', 'Sedes y subsedes', '/app/catalogos/sedes', 'settings', 2, 'ESTRUCTURA', 'sedes.ver', ['sistemas']);
        $mk('sys_est', 'sys_est_ciclos', 'Ciclos y periodos', '/app/catalogos/ciclos-periodos', 'panel', 3, 'ESTRUCTURA', 'catalogos.academicos.ver', ['sistemas']);
        $mk('sys_est', 'sys_est_mun', 'Municipios', '/app/catalogos/municipios', 'settings', 4, 'ESTRUCTURA', 'catalogos.ver', ['sistemas']);
        $mk('sys_est', 'sys_est_prog', 'Programas y ofertas', '/app/catalogos/programas-ofertas', 'panel', 5, 'ESTRUCTURA', 'catalogos.ver', ['sistemas']);
        $mk(null, 'sys_ce_grp', 'Control escolar', '#', 'matriculas', 6, 'CONTROL ESCOLAR', null, ['sistemas'], ['group_heading' => true]);
        $mk('sys_ce_grp', 'sys_ce_config', 'Configuración académica', '/app/control-escolar/catalogos', 'settings', 1, 'CONTROL ESCOLAR', 'control_escolar.catalogos.configurar', ['sistemas']);
        $mk(null, 'sys_sys', 'Sistema', '#', 'settings', 8, 'SISTEMA', null, ['sistemas'], ['group_heading' => true]);
        $mk('sys_sys', 'sys_users', 'Usuarios', '/app/admin/usuarios-roles', 'users', 1, 'SISTEMA', 'usuarios.ver', ['sistemas']);
        $mk('sys_sys', 'sys_roles', 'Roles y permisos', '/app/admin/usuarios-roles', 'users', 2, 'SISTEMA', 'roles.ver', ['sistemas']);
        $mk('sys_sys', 'sys_menus', 'Menús del sistema', '/app/admin/menus', 'panel', 3, 'SISTEMA', 'menus.administrar', ['sistemas']);
        $mk('sys_sys', 'sys_conf', 'Configuración', '/app/admin/parametros', 'settings', 4, 'SISTEMA', 'configuracion.ver', ['sistemas']);
        $mk('sys_sys', 'sys_cat', 'Catálogos técnicos', '/app/admin/catalogos', 'settings', 5, 'SISTEMA', 'catalogos.tecnicos.ver', ['sistemas']);
        $mk(null, 'sys_look', 'Apariencia del sistema', '/app/sistema/apariencia', 'settings', 9, 'SISTEMA', 'apariencia_sistema.administrar', ['sistemas']);
        $mk(null, 'sys_int', 'Integraciones', '/app/sistemas/configuracion', 'integrations', 20, 'TECNICO', 'integraciones.ver', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_jobs', 'Jobs / colas', '/app/sistemas/dashboard', 'status', 21, 'TECNICO', 'jobs.ver', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_logs', 'Logs técnicos', '/app/sistemas/logs', 'logs', 22, 'TECNICO', 'logs.ver', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_aud', 'Auditoría técnica', '/app/auditoria', 'audit', 23, 'TECNICO', 'auditoria.ver', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_pte', 'Incidencias técnicas de certificación', '/app/sistemas/proceso-tecnico-certificacion', 'validate', 28, 'TECNICO', 'cadena_original.generar', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_diag', 'Diagnóstico técnico', '/app/sistemas/documento-proceso-tecnico', 'validate', 29, 'TECNICO', 'firma.ver', ['sistemas'], ['technical_only' => true]);
        $mk('sys_pte', 'sys_pte_list', 'Listos para proceso técnico', '/app/sistemas/proceso-tecnico-certificacion?bandeja=listos-para-firma', 'docs', 1, 'TECNICO', 'firma.ver', ['sistemas'], ['technical_only' => true]);
        $mk('sys_pte', 'sys_pte_pen', 'Pendientes técnicos', '/app/sistemas/proceso-tecnico-certificacion?bandeja=pendientes-tecnicos', 'status', 2, 'TECNICO', 'xml.generar', ['sistemas'], ['technical_only' => true]);
        $mk('sys_pte', 'sys_pte_err', 'Errores de firma', '/app/sistemas/proceso-tecnico-certificacion?bandeja=errores-firma', 'audit', 3, 'TECNICO', 'firma.ver', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_proc', 'Procesos documentales técnicos', '#', 'docs', 30, 'TECNICO', 'xml.ver', ['sistemas'], ['group_heading' => true, 'technical_only' => true]);
        $mk('sys_proc', 'sys_doc_conf', 'Configuración documental', '/app/admin/parametros', 'settings', 0, 'TECNICO', 'configuracion.configurar', ['sistemas'], ['technical_only' => true]);
        $mk('sys_proc', 'sys_cadena', 'Cadena original', '/app/sistemas/configuracion', 'integrations', 1, 'TECNICO', 'cadena_original.generar', ['sistemas'], ['technical_only' => true]);
        $mk('sys_proc', 'sys_xml', 'XML', '/app/sistemas/configuracion', 'integrations', 2, 'TECNICO', 'xml.generar', ['sistemas'], ['technical_only' => true]);
        $mk('sys_proc', 'sys_firma', 'Firma', '/app/sistemas/proceso-tecnico-certificacion', 'validate', 3, 'TECNICO', 'firma.ver', ['sistemas'], ['technical_only' => true]);
        $mk('sys_proc', 'sys_pdf', 'PDF', '/app/sistemas/configuracion', 'docs', 4, 'TECNICO', 'pdf.generar', ['sistemas'], ['technical_only' => true]);
        $mk('sys_proc', 'sys_cp', 'Consulta pública', '/app/sistemas/configuracion', 'validate', 5, 'TECNICO', 'consulta_publica.configurar', ['sistemas'], ['technical_only' => true]);
        $mk(null, 'sys_err', 'Errores de procesos', '/app/sistemas/dashboard', 'status', 50, 'TECNICO', 'jobs.ver', ['sistemas'], ['technical_only' => true]);

        // ——— Educación Superior (Normales y UPN separados; sin administración técnica) ———
        $mk(null, 'es_ini', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['educacion_superior']);
        $mk(null, 'es_inst', 'Instituciones', '/app/educacion-superior/instituciones', 'settings', 2, 'OPERACION', 'instituciones.ver', ['educacion_superior']);
        $mk(null, 'es_sed', 'Sedes / Subsedes', '/app/educacion-superior/sedes', 'settings', 3, 'OPERACION', 'sedes.ver', ['educacion_superior']);
        $mk(null, 'es_pro', 'Programas académicos', '/app/educacion-superior/programas', 'panel', 4, 'OPERACION', 'programas.ver', ['educacion_superior']);
        $mk(null, 'es_plan', 'Planes de estudio', '/app/educacion-superior/planes', 'panel', 5, 'OPERACION', 'planes_estudio.ver', ['educacion_superior']);
        $mk(null, 'es_est', 'Estructura académica', '#', 'panel', 55, 'ESTRUCTURA', null, ['educacion_superior'], ['group_heading' => true]);
        $mk('es_est', 'es_cat_acad', 'Catálogos académicos', '/app/catalogos-academicos', 'panel', 0, 'ESTRUCTURA', 'catalogos.academicos.ver', ['educacion_superior']);
        $mk(null, 'es_sol', 'Solicitudes de matrícula', '/app/solicitudes-matricula', 'matriculas', 6, 'OPERACION', 'solicitudes_matricula.ver', ['educacion_superior']);
        $mk(null, 'es_val', 'Validaciones normativas', '/app/educacion-superior/validaciones-normativas', 'validate', 7, 'OPERACION', 'validaciones_normativas.ver', ['educacion_superior']);
        $mk(null, 'es_norm_grp', 'Normales', '#', 'docs', 8, 'OPERACION', 'certificacion.ver', ['educacion_superior'], ['group_heading' => true]);
        $mk('es_norm_grp', 'es_norm_cert', 'Certificación', '/app/educacion-superior/normales/certificacion', 'docs', 1, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk('es_norm_grp', 'es_norm_tit', 'Títulos', '/app/educacion-superior/normales/titulos', 'docs', 2, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk('es_norm_grp', 'es_norm_gra', 'Grados académicos', '/app/educacion-superior/normales/grados-academicos', 'docs', 3, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk('es_norm_grp', 'es_norm_con', 'Constancias', '/app/educacion-superior/normales/constancias', 'docs', 4, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk(null, 'es_upn_grp', 'UPN', '#', 'docs', 9, 'OPERACION', 'certificacion.ver', ['educacion_superior'], ['group_heading' => true]);
        $mk('es_upn_grp', 'es_upn_cert', 'Certificación', '/app/educacion-superior/upn/certificacion', 'docs', 1, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk('es_upn_grp', 'es_upn_tit', 'Títulos', '/app/educacion-superior/upn/titulos', 'docs', 2, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk('es_upn_grp', 'es_upn_gra', 'Grados académicos', '/app/educacion-superior/upn/grados-academicos', 'docs', 3, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk('es_upn_grp', 'es_upn_con', 'Constancias', '/app/educacion-superior/upn/constancias', 'docs', 4, 'OPERACION', 'certificacion.ver', ['educacion_superior']);
        $mk(null, 'es_cert_rev', 'Revisión por expediente', '/app/educacion-superior/revision', 'validate', 10, 'OPERACION', 'certificacion.validar', ['educacion_superior']);
        $mk(null, 'es_rep', 'Reportes oficiales', '/app/educacion-superior/reportes-oficiales', 'report', 11, 'OPERACION', 'reportes_oficiales.ver', ['educacion_superior']);
        $mk(null, 'es_cp', 'Consulta pública', '/app/consulta/documentos', 'validate', 12, 'CONSULTA', 'consulta_publica.ver', ['educacion_superior']);
        $mk(null, 'es_not', 'Notificaciones', '/app/notificaciones', 'status', 13, 'OPERACION', 'notificaciones.ver', ['educacion_superior']);

        // ——— Dirección de escuela (supervisión Normal / UPN; sin técnica ni matrícula operativa) ———
        $mk(null, 'dir_ini', 'Dashboard', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['director_escuela']);
        $mk(null, 'dir_ind', 'Indicadores', '/app/direccion/indicadores', 'report', 2, 'SUPERVISION', 'indicadores.ver', ['director_escuela']);
        $mk(null, 'dir_alu', 'Alumnos', '/app/direccion/alumnos', 'users', 3, 'SUPERVISION', 'alumnos.ver', ['director_escuela']);
        $mk(null, 'dir_ins', 'Inscripciones', '/app/direccion/inscripciones', 'matriculas', 4, 'SUPERVISION', 'inscripciones.ver', ['director_escuela']);
        $mk(null, 'dir_rein', 'Reinscripciones', '/app/direccion/reinscripciones', 'matriculas', 5, 'SUPERVISION', 'reinscripciones.ver', ['director_escuela']);
        $mk(null, 'dir_cal', 'Calificaciones', '/app/direccion/calificaciones', 'materias', 6, 'SUPERVISION', 'calificaciones.ver', ['director_escuela']);
        $mk(null, 'dir_eg', 'Egreso y titulación', '/app/direccion/egreso-titulacion', 'docs', 7, 'SUPERVISION', 'egreso.ver', ['director_escuela']);
        $mk(null, 'dir_rep', 'Reportes', '/app/direccion/reportes', 'report', 8, 'SUPERVISION', 'reportes.ver', ['director_escuela']);
        $mk(null, 'dir_doc', 'Documentos', '/app/direccion/documentos', 'docs', 9, 'SUPERVISION', 'documentos.ver', ['director_escuela']);
        $mk(null, 'dir_not', 'Notificaciones', '/app/direccion/notificaciones', 'status', 10, 'SUPERVISION', 'notificaciones.ver', ['director_escuela']);
        $mk(null, 'dir_exp', 'Expedientes', '/app/expedientes', 'docs', 11, 'SUPERVISION', 'expedientes.ver', ['director_escuela']);
        $mk(null, 'dir_aut', 'Autorizaciones / Observaciones', '/app/direccion/autorizaciones-observaciones', 'audit', 12, 'SUPERVISION', 'autorizaciones.ver', ['director_escuela']);

        // ——— Control Escolar (operación Normal / UPN; vistas unificadas /app/control-escolar/*) ———
        $mk(null, 'ce_ini', 'Dashboard', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_grp', 'Control escolar', '#', 'matriculas', 2, 'CONTROL ESCOLAR', null, ['control_escolar_escuela'], ['group_heading' => true]);
        $mk('ce_grp', 'ce_alu', 'Alumnos', '/app/control-escolar/alumnos', 'users', 1, 'CONTROL ESCOLAR', 'alumnos.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_exp', 'Expedientes', '/app/control-escolar/expedientes', 'docs', 2, 'CONTROL ESCOLAR', 'expedientes.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_ins', 'Inscripciones', '/app/control-escolar/inscripciones', 'matriculas', 3, 'CONTROL ESCOLAR', 'inscripciones.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_rei', 'Reinscripciones', '/app/control-escolar/reinscripciones', 'matriculas', 4, 'CONTROL ESCOLAR', 'reinscripciones.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_trk', 'Trayectoria', '/app/control-escolar/trayectoria', 'trayectoria', 5, 'CONTROL ESCOLAR', 'trayectoria.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_cal', 'Calificaciones', '/app/control-escolar/calificaciones', 'materias', 6, 'CONTROL ESCOLAR', 'calificaciones.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_doc', 'Documentos', '/app/control-escolar/documentos', 'docs', 7, 'CONTROL ESCOLAR', 'documentos.ver', ['control_escolar_escuela']);
        $mk('ce_grp', 'ce_config', 'Configuración académica', '/app/control-escolar/catalogos', 'settings', 8, 'CONTROL ESCOLAR', 'control_escolar.catalogos.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_cert', 'Certificación', '#', 'docs', 10, 'CERTIFICACIÓN', 'documentos.ver', ['control_escolar_escuela'], ['group_heading' => true]);
        $mk('ce_cert', 'ce_cert_band', 'Bandejas', '/app/documentos/bandejas/por-rol', 'docs', 1, 'CERTIFICACIÓN', 'documentos.ver', ['control_escolar_escuela']);
        $mk('ce_cert', 'ce_cert_sol', 'Solicitud documental', '/app/certificacion/solicitud', 'docs', 2, 'CERTIFICACIÓN', 'documentos.crear_borrador', ['control_escolar_escuela']);
        $mk('ce_cert', 'ce_cert_gen', 'Folios y emisión', '/app/certificacion/generacion-documentos', 'docs', 3, 'CERTIFICACIÓN', 'documentos.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_baj', 'Bajas y cambios', '/app/control-escolar/bajas-cambios', 'audit', 20, 'OPERACION', 'expedientes.editar', ['control_escolar_escuela']);
        $mk(null, 'ce_sol', 'Solicitudes', '/app/control-escolar/solicitudes', 'matriculas', 21, 'OPERACION', 'expedientes.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_imp', 'Importaciones', '/app/control-escolar/importaciones', 'import', 22, 'OPERACION', 'importaciones_academicas.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_obs', 'Observaciones', '/app/control-escolar/observaciones', 'audit', 23, 'OPERACION', 'observaciones.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_rep', 'Reportes', '/app/control-escolar/reportes', 'report', 24, 'OPERACION', 'reportes.ver', ['control_escolar_escuela']);
        $mk(null, 'ce_not', 'Notificaciones', '/app/control-escolar/notificaciones', 'status', 25, 'OPERACION', 'notificaciones.ver', ['control_escolar_escuela']);

        // ——— Responsable admisión ———
        $mk(null, 'ra_ini', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'admision.ver', ['responsable_admision']);
        $mk(null, 'ra_asp', 'Aspirantes', '/app/expedientes', 'users', 5, 'ADMISION', 'aspirantes.ver', ['responsable_admision']);
        $mk(null, 'ra_adm', 'Admisión', '/app/expedientes', 'validate', 6, 'ADMISION', 'admision.ver', ['responsable_admision']);
        $mk(null, 'ra_exp', 'Expedientes de ingreso', '/app/expedientes', 'docs', 7, 'ADMISION', 'expedientes.ver', ['responsable_admision']);
        $mk(null, 'ra_obs', 'Observaciones', '/app/observaciones', 'audit', 10, 'ADMISION', 'observaciones.ver', ['responsable_admision']);

        // ——— Responsable evaluación ———
        $mk(null, 'rev_ini', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['responsable_evaluacion']);
        $mk(null, 'rev_gru', 'Grupos', '/app/coordinador/dashboard', 'panel', 5, 'EVAL', 'grupos.ver', ['responsable_evaluacion']);
        $mk(null, 'rev_mat', 'Materias / docentes', '/app/coordinador/dashboard', 'materias', 6, 'EVAL', 'carga_academica.ver', ['responsable_evaluacion']);
        $mk(null, 'rev_cal', 'Captura de calificaciones', '/app/coordinador/dashboard', 'materias', 7, 'EVAL', 'calificaciones.capturar', ['responsable_evaluacion']);
        $mk(null, 'rev_act', 'Actas', '/app/coordinador/dashboard', 'docs', 8, 'EVAL', 'actas.ver', ['responsable_evaluacion']);
        $mk(null, 'rev_cor', 'Correcciones', '/app/coordinador/dashboard', 'audit', 9, 'EVAL', 'correcciones_calificacion.ver', ['responsable_evaluacion']);
        $mk(null, 'rev_rep', 'Reportes', '/app/admin/reportes-basicos', 'report', 20, 'EVAL', 'reportes.ver', ['responsable_evaluacion']);

        // ——— Responsable certificación (operación documental; sin catálogos en menú) ———
        $mk(null, 'rc_ini', 'Inicio', '/app/certificacion/dashboard', 'home', 1, 'MAIN', 'certificacion.ver', ['responsable_certificacion_titulacion']);
        $mk(null, 'rc_mod', 'Certificación', '#', 'docs', 2, 'CERTIFICACIÓN', 'certificacion.ver', ['responsable_certificacion_titulacion'], ['group_heading' => true]);
        $mk('rc_mod', 'rc_band', 'Bandejas', '/app/documentos/bandejas/por-rol', 'docs', 1, 'CERTIFICACIÓN', 'documentos.ver', ['responsable_certificacion_titulacion']);
        $mk('rc_mod', 'rc_docac', 'Documentos académicos', '/app/certificacion/documentos-a-certificar', 'docs', 2, 'CERTIFICACIÓN', 'documentos.ver', ['responsable_certificacion_titulacion']);
        $mk('rc_mod', 'rc_fol', 'Folios y emisión', '/app/certificacion/generacion-documentos', 'docs', 3, 'CERTIFICACIÓN', 'documentos.ver', ['responsable_certificacion_titulacion']);
        $mk('rc_mod', 'rc_firma', 'Firma y proceso documental', '/app/certificacion/firma-electronica', 'validate', 4, 'CERTIFICACIÓN', 'certificacion.ver', ['responsable_certificacion_titulacion']);
        $mk('rc_mod', 'rc_hist', 'Historial', '/app/certificacion/entrega-seguimiento', 'history', 5, 'CERTIFICACIÓN', 'documentos.ver', ['responsable_certificacion_titulacion']);
        $mk(null, 'rc_cp', 'Consulta pública', '/app/consulta/documentos', 'validate', 11, 'CONSULTA', 'consulta_publica.ver', ['responsable_certificacion_titulacion']);

        // ——— Docente ———
        $mk(null, 'doc_ini', 'Inicio', '/app/docente/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['docente']);
        $mk(null, 'doc_gru', 'Mis grupos', '/app/docente/dashboard', 'panel', 5, 'DOCENTE', 'grupos.ver_propios', ['docente']);
        $mk(null, 'doc_mat', 'Mis materias', '/app/docente/dashboard', 'materias', 6, 'DOCENTE', 'materias.ver_propias', ['docente']);
        $mk(null, 'doc_cal', 'Captura de calificaciones', '/app/docente/dashboard', 'materias', 7, 'DOCENTE', 'calificaciones.capturar_propias', ['docente']);
        $mk(null, 'doc_act', 'Actas asignadas', '/app/docente/dashboard', 'docs', 8, 'DOCENTE', 'actas.ver_propias', ['docente']);

        // ——— Auditor ———
        $mk(null, 'au_ini', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['auditor']);
        $mk(null, 'au_exp', 'Consulta de expedientes', '/app/expedientes', 'users', 5, 'CONSULTA', 'expedientes.ver', ['auditor']);
        $mk(null, 'au_doc', 'Documentos emitidos', '/app/consulta/documentos', 'docs', 6, 'CONSULTA', 'documentos.ver', ['auditor']);
        $mk(null, 'au_aud', 'Auditoría', '/app/auditoria', 'audit', 7, 'CONSULTA', 'auditoria.ver', ['auditor']);
        $mk(null, 'au_rep', 'Reportes', '/app/admin/reportes-basicos', 'report', 8, 'CONSULTA', 'reportes.ver', ['auditor']);
        $mk(null, 'au_log', 'Logs solo lectura', '/app/sistemas/logs', 'logs', 9, 'CONSULTA', 'logs.ver_lectura', ['auditor'], ['technical_only' => true]);

        // ——— Alumno egresado ———
        $mk(null, 'al_ini', 'Mi inicio', '/app/dashboard', 'home', 1, 'PORTAL', 'portal.ver', ['alumno_egresado']);
        $mk(null, 'al_exp', 'Mi expediente', '/app/dashboard', 'docs', 5, 'PORTAL', 'expediente.ver_propio', ['alumno_egresado']);
        $mk(null, 'al_cal', 'Mis calificaciones', '/app/dashboard', 'materias', 6, 'PORTAL', 'calificaciones.ver_propias', ['alumno_egresado']);
        $mk(null, 'al_kar', 'Mi Kardex', '/app/dashboard', 'trayectoria', 7, 'PORTAL', 'kardex.ver_propio', ['alumno_egresado']);
        $mk(null, 'al_doc', 'Mis documentos', '/app/dashboard', 'mydocs', 8, 'PORTAL', 'documentos.ver_propios', ['alumno_egresado']);
        $mk(null, 'al_tr', 'Mis trámites', '/app/dashboard', 'docs', 9, 'PORTAL', 'tramites.ver_propios', ['alumno_egresado']);

        // ——— Aspirante ———
        $mk(null, 'as_ini', 'Registro', '/app/dashboard', 'home', 1, 'ADMISION', 'admision.portal', ['aspirante_preinscrito']);
        $mk(null, 'as_dat', 'Mis datos', '/app/dashboard', 'profile', 5, 'ADMISION', 'aspirantes.editar_propio', ['aspirante_preinscrito']);
        $mk(null, 'as_est', 'Estado de admisión', '/app/dashboard', 'status', 6, 'ADMISION', 'admision.ver_estado_propio', ['aspirante_preinscrito']);
        $mk(null, 'as_obs', 'Observaciones', '/app/dashboard', 'audit', 7, 'ADMISION', 'observaciones.ver_propias', ['aspirante_preinscrito']);

        // ——— Consulta / Coordinador (compatibilidad) ———
        $mk(null, 'con_ini', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['consulta']);
        $mk(null, 'con_pan', 'Panel consulta', '/app/consulta/dashboard', 'history', 5, 'CONSULTA', 'dashboard.ver', ['consulta']);
        $mk(null, 'con_doc', 'Documentos', '/app/consulta/documentos', 'docs', 6, 'CONSULTA', 'documentos.ver', ['consulta']);
        $mk(null, 'coor_ini', 'Inicio', '/app/dashboard', 'home', 1, 'MAIN', 'dashboard.ver', ['coordinador_academico']);
        $mk(null, 'coor_pan', 'Panel coordinación', '/app/coordinador/dashboard', 'panel', 5, 'OPERACION', 'dashboard.ver', ['coordinador_academico']);
    }
}
