<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->forgetCachedPermissions();

        $guard = 'web';

        /** @var list<string> Permisos canónicos (Bloque 14) y extensión operativa/técnica. */
        $permissions = [
            // Catálogos (certificación)
            'ver_catalogos',
            'gestionar_catalogos',
            // Catálogos extendidos (institucional)
            'ver_subsistemas',
            'gestionar_subsistemas',
            'ver_regiones',
            'gestionar_regiones',
            'ver_instituciones',
            'gestionar_instituciones',
            'ver_sedes',
            'gestionar_sedes',
            'ver_ofertas_academicas',
            'gestionar_ofertas_academicas',
            // Entidades de captura
            'ver_alumnos',
            'gestionar_alumnos',
            'ver_matriculas',
            'gestionar_matriculas',
            'ver_materias',
            'gestionar_materias',
            'ver_trayectorias',
            'gestionar_trayectorias',
            // Documentos académicos
            'ver_documentos',
            'crear_documentos',
            'editar_documentos',
            'enviar_revision',
            'aprobar_documentos',
            'rechazar_documentos',
            'cancelar_documentos',
            'preparar_documento_firma',
            // Configuración técnica / integración (bloques posteriores)
            'gestionar_configuracion_firma',
            'gestionar_plantillas_documentos',
            'gestionar_reglas_cadena',
            'gestionar_plantillas_xml',
            'gestionar_firmantes',
            'generar_cadena',
            'generar_xml',
            'solicitar_firma',
            'reintentar_firma',
            'generar_pdf',
            'ver_pdf',
            'ver_xml',
            // Auditoría e historial
            'ver_logs_integracion',
            'ver_auditoria',
            'ver_historial_estados',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => $guard],
            );
        }

        $registrar->forgetCachedPermissions();

        $todos = Permission::query()
            ->where('guard_name', $guard)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $controlEscolarEscuela = [
            'ver_catalogos',
            'ver_alumnos',
            'gestionar_alumnos',
            'ver_matriculas',
            'gestionar_matriculas',
            'ver_materias',
            'gestionar_materias',
            'ver_trayectorias',
            'gestionar_trayectorias',
            'ver_documentos',
            'crear_documentos',
            'editar_documentos',
            'enviar_revision',
        ];

        $directorEscuela = [
            'ver_catalogos',
            'ver_alumnos',
            'ver_matriculas',
            'ver_materias',
            'ver_trayectorias',
            'ver_documentos',
            'enviar_revision',
        ];

        $educacionSuperior = [
            'ver_catalogos',
            'ver_alumnos',
            'ver_matriculas',
            'ver_materias',
            'ver_trayectorias',
            'ver_documentos',
            'editar_documentos',
            'aprobar_documentos',
            'rechazar_documentos',
            'cancelar_documentos',
            'preparar_documento_firma',
            'ver_historial_estados',
        ];

        $sistemas = [
            'ver_documentos',
            'preparar_documento_firma',
            'gestionar_configuracion_firma',
            'gestionar_plantillas_documentos',
            'gestionar_reglas_cadena',
            'gestionar_plantillas_xml',
            'ver_logs_integracion',
            'ver_auditoria',
            'ver_historial_estados',
        ];

        $admin = [
            'ver_catalogos',
            'gestionar_catalogos',
            'ver_alumnos',
            'gestionar_alumnos',
            'ver_matriculas',
            'gestionar_matriculas',
            'ver_materias',
            'gestionar_materias',
            'ver_trayectorias',
            'gestionar_trayectorias',
            'ver_documentos',
            'crear_documentos',
            'editar_documentos',
            'enviar_revision',
            'aprobar_documentos',
            'rechazar_documentos',
            'cancelar_documentos',
            'preparar_documento_firma',
            'ver_historial_estados',
        ];

        $docente = [
            'ver_catalogos',
            'ver_materias',
        ];

        $coordinadorAcademico = [
            'ver_catalogos',
            'ver_alumnos',
            'ver_materias',
            'ver_matriculas',
        ];

        $auditor = [
            'ver_auditoria',
            'ver_logs_integracion',
            'ver_historial_estados',
            'ver_documentos',
            'ver_catalogos',
        ];

        $consulta = [
            'ver_documentos',
        ];

        $roles = [
            'superadmin' => $todos,
            'admin' => $admin,
            'control_escolar_escuela' => $controlEscolarEscuela,
            'director_escuela' => $directorEscuela,
            'educacion_superior' => $educacionSuperior,
            'sistemas' => $sistemas,
            'docente' => $docente,
            'coordinador_academico' => $coordinadorAcademico,
            'auditor' => $auditor,
            'consulta' => $consulta,
        ];

        foreach ($roles as $nombre => $lista) {
            $role = Role::firstOrCreate(
                ['name' => $nombre, 'guard_name' => $guard],
            );
            $role->syncPermissions($lista);
        }

        $registrar->forgetCachedPermissions();
    }
}
