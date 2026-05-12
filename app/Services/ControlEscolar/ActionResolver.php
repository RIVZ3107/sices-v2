<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\SolicitudMatricula;
use App\Models\User;
use App\Services\Dashboard\DashboardRoleResolver;

/**
 * Catálogo central de acciones UI por rol, entidad y estado.
 * El frontend no debe inventar rutas ni permisos: consume este contrato.
 */
final class ActionResolver
{
    public function __construct(
        private readonly DashboardRoleResolver $roleResolver,
    ) {}

    /**
     * @param  array{entity?: string, estado?: string|null, documento_estado_workflow?: string|null}  $context
     * @return list<array<string, mixed>>
     */
    public function resolve(User $user, array $context = []): array
    {
        $role = $this->roleResolver->resolvePrimaryRole($user);
        if ($role === null) {
            return [];
        }

        $entity = (string) ($context['entity'] ?? 'general');
        $estado = isset($context['estado']) ? (string) $context['estado'] : null;
        $docEstado = isset($context['documento_estado_workflow']) ? (string) $context['documento_estado_workflow'] : null;
        if ($docEstado === null && $entity === 'documento_academico' && $estado !== null) {
            $docEstado = $estado;
        }

        $keys = match ($entity) {
            'solicitud_matricula' => $this->keysForSolicitudMatricula($role, $estado ?? ''),
            'documento_academico' => $this->keysForDocumentoAcademico($role, $docEstado ?? ''),
            'captura_calificaciones' => $this->keysForCapturaCalificaciones($role, $estado ?? ''),
            default => $this->keysForGeneral($role),
        };

        $keys = $this->filterProhibited($role, $keys);
        $keys = array_values(array_unique($keys));

        $out = [];
        foreach ($keys as $key) {
            $def = self::catalog()[$key] ?? null;
            if ($def === null) {
                continue;
            }
            $permEffective = $this->effectivePermission($role, $key, (string) $def['permission_required']);
            [$enabled, $reason] = $this->computeEnabled($user, $role, $key, $def, $entity, $estado, $docEstado, $permEffective);
            $out[] = [
                'key' => $key,
                'label' => $def['label'],
                'description' => $def['description'],
                'route' => $def['route'],
                'method' => $def['method'],
                'permission_required' => $permEffective,
                'enabled' => $enabled,
                'disabled_reason' => $reason,
                'priority' => $def['priority'],
                'variant' => $def['variant'],
                'icon' => $def['icon'],
            ];
        }

        usort($out, static fn (array $a, array $b): int => ($a['priority'] <=> $b['priority']) ?: strcmp((string) $a['key'], (string) $b['key']));

        return $out;
    }

    /**
     * @return list<string>
     */
    private function filterProhibited(string $role, array $keys): array
    {
        $blocked = self::prohibitedByRole()[$role] ?? [];

        return array_values(array_filter($keys, static fn (string $k): bool => ! in_array($k, $blocked, true)));
    }

    /**
     * @return array<string, list<string>>
     */
    private static function prohibitedByRole(): array
    {
        return [
            'control_escolar_escuela' => [
                'asignar_matricula',
                'generar_xml',
                'firmar_documento',
                'ver_logs_tecnicos',
                'administrar_menus',
                'ejecutar_firma_tecnica',
                'validar_xml',
                'generar_cadena',
                'generar_pdf',
            ],
            'sistemas' => [
                'asignar_matricula',
                'capturar_calificaciones',
                'aprobar_institucionalmente',
                'validar_normativamente',
                'revisar_solicitud_matricula',
                'devolver_solicitud_matricula',
                'rechazar_solicitud_matricula',
            ],
        ];
    }

    /**
     * @return list<string>
     */
    private function keysForGeneral(string $role): array
    {
        return match ($role) {
            'control_escolar_escuela' => [
                'abrir_expediente',
                'registrar_aspirante',
                'completar_expediente',
                'preparar_solicitud_matricula',
                'registrar_inscripcion',
                'capturar_calificaciones',
                'importar_calificaciones',
                'recalcular_trayectoria',
                'ver_kardex',
                'crear_solicitud_documento',
                'atender_observaciones',
            ],
            'educacion_superior' => [
                'revisar_solicitud_matricula',
                'revisar_expediente',
                'validar_normativamente',
                'liberar_proceso_tecnico',
                'revisar_reportes_globales',
            ],
            'director_escuela' => [
                'abrir_expediente',
                'revisar_expediente',
                'aprobar_institucionalmente',
                'rechazar_institucionalmente',
                'revisar_reportes_globales',
            ],
            'sistemas' => [
                'administrar_menus',
                'ver_logs',
                'ver_jobs',
                'reintentar_job',
                'configurar_integracion',
                'generar_cadena',
                'generar_xml',
                'validar_xml',
                'ejecutar_firma_tecnica',
                'generar_pdf',
                'ver_auditoria_tecnica',
            ],
            'responsable_admision' => [
                'registrar_aspirante',
                'abrir_expediente',
                'completar_expediente',
                'revisar_expediente',
            ],
            'responsable_evaluacion' => [
                'capturar_calificaciones',
                'importar_calificaciones',
                'recalcular_trayectoria',
                'revisar_reportes_globales',
            ],
            'responsable_certificacion_titulacion' => [
                'preparar_documento_certificacion',
                'liberar_proceso_tecnico',
                'crear_solicitud_documento',
                'revisar_expediente',
            ],
            'docente' => [
                'capturar_calificaciones',
                'acceder_panel_docente',
            ],
            'auditor' => [
                'ver_auditoria_consulta',
                'ver_documentos_consulta',
                'ver_expediente_consulta',
            ],
            'alumno_egresado' => [
                'ver_mi_expediente',
                'ver_kardex',
                'ver_mis_documentos',
            ],
            'aspirante_preinscrito' => [
                'ver_estado_admision',
                'actualizar_mis_datos_admision',
            ],
            'superadmin', 'admin' => [
                'administrar_menus',
                'ver_logs',
                'ver_jobs',
                'revisar_expediente',
                'revisar_reportes_globales',
            ],
            'consulta' => [
                'ver_documentos_consulta',
                'ver_expediente_consulta',
            ],
            'coordinador_academico' => [
                'capturar_calificaciones',
                'importar_calificaciones',
                'recalcular_trayectoria',
                'revisar_reportes_globales',
            ],
            default => [],
        };
    }

    /**
     * @return list<string>
     */
    private function keysForSolicitudMatricula(string $role, string $estado): array
    {
        $map = [
            SolicitudMatricula::ESTADO_BORRADOR => [
                'control_escolar_escuela' => ['preparar_solicitud_matricula', 'enviar_solicitud_matricula', 'abrir_expediente'],
                'educacion_superior' => [],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_ENVIADA => [
                'control_escolar_escuela' => ['ver_matricula_asignada'],
                'educacion_superior' => ['revisar_solicitud_matricula', 'devolver_solicitud_matricula', 'rechazar_solicitud_matricula'],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_EN_REVISION => [
                'control_escolar_escuela' => ['ver_matricula_asignada'],
                'educacion_superior' => ['revisar_solicitud_matricula', 'devolver_solicitud_matricula', 'rechazar_solicitud_matricula'],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_CON_OBSERVACIONES => [
                'control_escolar_escuela' => ['atender_observacion_matricula', 'enviar_solicitud_matricula'],
                'educacion_superior' => [],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_APROBADA => [
                'control_escolar_escuela' => ['ver_matricula_asignada'],
                'educacion_superior' => ['asignar_matricula'],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA => [
                'control_escolar_escuela' => ['registrar_inscripcion', 'registrar_reinscripcion', 'generar_carga_academica', 'ver_matricula_asignada'],
                'educacion_superior' => [],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_RECHAZADA => [
                'control_escolar_escuela' => ['abrir_expediente'],
                'educacion_superior' => [],
                'director_escuela' => [],
            ],
            SolicitudMatricula::ESTADO_CANCELADA => [
                'control_escolar_escuela' => ['abrir_expediente'],
                'educacion_superior' => [],
                'director_escuela' => [],
            ],
        ];

        $branch = $map[$estado] ?? null;
        if ($branch === null) {
            return $this->keysForGeneral($role);
        }

        return $branch[$role] ?? $this->keysForGeneral($role);
    }

    /**
     * @return list<string>
     */
    private function keysForDocumentoAcademico(string $role, string $estadoWorkflow): array
    {
        return match ($estadoWorkflow) {
            'borrador' => match ($role) {
                'control_escolar_escuela' => ['enviar_revision_documento', 'atender_observaciones', 'abrir_expediente'],
                'director_escuela' => ['revisar_expediente'],
                default => [],
            },
            'pendiente', 'en_revision' => match ($role) {
                'director_escuela' => ['aprobar_institucionalmente', 'rechazar_institucionalmente', 'revisar_expediente'],
                'educacion_superior' => ['revisar_expediente', 'validar_normativamente'],
                'control_escolar_escuela' => ['atender_observaciones', 'abrir_expediente'],
                default => [],
            },
            'aprobado' => match ($role) {
                'educacion_superior' => ['validar_normativamente', 'liberar_proceso_tecnico', 'revisar_expediente'],
                'responsable_certificacion_titulacion' => ['preparar_documento_certificacion', 'liberar_proceso_tecnico'],
                'sistemas' => ['generar_xml', 'ejecutar_firma_tecnica', 'generar_pdf', 'generar_cadena'],
                default => [],
            },
            'rechazado' => match ($role) {
                'control_escolar_escuela' => ['atender_observaciones', 'enviar_revision_documento'],
                'director_escuela' => ['revisar_expediente'],
                default => [],
            },
            default => $this->keysForGeneral($role),
        };
    }

    /**
     * @return list<string>
     */
    private function keysForCapturaCalificaciones(string $role, string $estado): array
    {
        if ($estado === 'correccion_solicitada' && in_array($role, ['responsable_evaluacion', 'coordinador_academico', 'director_escuela'], true)) {
            return ['aprobar_correccion_calificacion', 'rechazar_correccion_calificacion', 'revisar_reportes_globales'];
        }

        if ($estado === 'captura_abierta') {
            return match ($role) {
                'docente', 'control_escolar_escuela', 'responsable_evaluacion', 'coordinador_academico' => ['capturar_calificaciones', 'importar_calificaciones'],
                default => [],
            };
        }

        if ($estado === 'cerrada') {
            $keys = [];
            if (in_array($role, ['docente', 'control_escolar_escuela', 'responsable_evaluacion', 'coordinador_academico'], true)) {
                $keys[] = 'capturar_calificaciones';
            }
            if (in_array($role, ['docente', 'control_escolar_escuela', 'responsable_evaluacion', 'coordinador_academico'], true)) {
                $keys[] = 'solicitar_correccion_calificacion';
            }

            return array_values(array_unique($keys));
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $def
     * @return array{0: bool, 1: string}
     */
    private function computeEnabled(
        User $user,
        string $role,
        string $key,
        array $def,
        string $entity,
        ?string $estado,
        ?string $docEstado,
        string $permissionEffective,
    ): array {
        if ($permissionEffective === '') {
            return [true, ''];
        }

        $may = $this->userMay($user, $permissionEffective, $role);

        if (! $may) {
            return [false, 'Permiso insuficiente: '.$permissionEffective];
        }

        if ($entity === 'captura_calificaciones' && $key === 'capturar_calificaciones' && ($estado ?? '') === 'cerrada') {
            return [false, 'La captura de calificaciones está cerrada para este periodo.'];
        }

        if ($entity === 'solicitud_matricula' && $key === 'asignar_matricula' && ($estado ?? '') !== SolicitudMatricula::ESTADO_APROBADA) {
            return [false, 'La matrícula solo se asigna cuando la solicitud está aprobada.'];
        }

        if ($entity === 'documento_academico' && in_array($key, ['generar_xml', 'ejecutar_firma_tecnica', 'generar_pdf', 'generar_cadena'], true) && ($docEstado ?? '') !== 'aprobado') {
            return [false, 'El proceso técnico solo aplica con documento en estado aprobado.'];
        }

        return [true, ''];
    }

    private function effectivePermission(string $role, string $key, string $fallback): string
    {
        $matrix = [
            'capturar_calificaciones' => [
                'docente' => 'calificaciones.capturar_propias',
                'control_escolar_escuela' => 'calificaciones.capturar',
                'responsable_evaluacion' => 'calificaciones.capturar',
                'coordinador_academico' => 'calificaciones.capturar',
            ],
            'importar_calificaciones' => [
                'control_escolar_escuela' => 'importaciones_academicas.importar',
                'responsable_evaluacion' => 'importaciones_academicas.importar',
                'coordinador_academico' => 'importaciones_academicas.importar',
            ],
            'recalcular_trayectoria' => [
                'control_escolar_escuela' => 'trayectoria.recalcular',
                'responsable_evaluacion' => 'trayectoria.recalcular',
                'coordinador_academico' => 'trayectoria.recalcular',
            ],
            'ver_kardex' => [
                'alumno_egresado' => 'kardex.ver_propio',
                'control_escolar_escuela' => 'kardex.ver',
            ],
            'abrir_expediente' => [
                'control_escolar_escuela' => 'expedientes.ver',
                'director_escuela' => 'expedientes.ver',
                'responsable_admision' => 'expedientes.ver',
            ],
            'registrar_inscripcion' => [
                'control_escolar_escuela' => 'inscripciones.crear',
            ],
            'registrar_reinscripcion' => [
                'control_escolar_escuela' => 'reinscripciones.crear',
            ],
            'generar_carga_academica' => [
                'control_escolar_escuela' => 'carga_academica.generar',
            ],
            'preparar_solicitud_matricula' => [
                'control_escolar_escuela' => 'solicitudes_matricula.crear',
            ],
            'enviar_solicitud_matricula' => [
                'control_escolar_escuela' => 'solicitudes_matricula.enviar',
            ],
            'atender_observacion_matricula' => [
                'control_escolar_escuela' => 'solicitudes_matricula.atender_observaciones',
            ],
            'ver_matricula_asignada' => [
                'control_escolar_escuela' => 'matriculas.ver',
            ],
            'revisar_solicitud_matricula' => [
                'educacion_superior' => 'solicitudes_matricula.revisar',
            ],
            'devolver_solicitud_matricula' => [
                'educacion_superior' => 'solicitudes_matricula.devolver',
            ],
            'rechazar_solicitud_matricula' => [
                'educacion_superior' => 'solicitudes_matricula.rechazar',
            ],
            'asignar_matricula' => [
                'educacion_superior' => 'matriculas.asignar',
            ],
            'administrar_menus' => [
                'sistemas' => 'menus.administrar',
            ],
            'ver_logs' => [
                'sistemas' => 'logs.ver',
            ],
            'ver_jobs' => [
                'sistemas' => 'jobs.ver',
            ],
            'reintentar_job' => [
                'sistemas' => 'jobs.reintentar',
            ],
            'configurar_integracion' => [
                'sistemas' => 'integraciones.configurar',
            ],
            'generar_cadena' => [
                'sistemas' => 'cadena_original.generar',
            ],
            'generar_xml' => [
                'sistemas' => 'xml.generar',
            ],
            'validar_xml' => [
                'sistemas' => 'xml.validar',
            ],
            'ejecutar_firma_tecnica' => [
                'sistemas' => 'firma.ejecutar',
            ],
            'generar_pdf' => [
                'sistemas' => 'pdf.generar',
            ],
            'ver_auditoria_tecnica' => [
                'sistemas' => 'auditoria.ver',
            ],
            'ver_documentos_consulta' => [
                'auditor' => 'documentos.ver',
                'consulta' => 'documentos.ver',
            ],
            'ver_expediente_consulta' => [
                'auditor' => 'expedientes.ver',
                'consulta' => 'expedientes.ver',
            ],
            'ver_auditoria_consulta' => [
                'auditor' => 'auditoria.ver',
            ],
            'completar_expediente' => [
                'responsable_admision' => 'expedientes.editar',
                'control_escolar_escuela' => 'expedientes.editar',
            ],
            'registrar_aspirante' => [
                'control_escolar_escuela' => 'aspirantes.crear',
                'responsable_admision' => 'aspirantes.crear',
            ],
            'acceder_panel_docente' => [
                'docente' => 'dashboard.ver',
            ],
            'actualizar_mis_datos_admision' => [
                'aspirante_preinscrito' => 'aspirantes.editar_propio',
            ],
            'aprobar_correccion_calificacion' => [
                'responsable_evaluacion' => 'correcciones_calificacion.aprobar',
                'coordinador_academico' => 'correcciones_calificacion.aprobar',
                'director_escuela' => 'correcciones_calificacion.autorizar',
            ],
            'rechazar_correccion_calificacion' => [
                'responsable_evaluacion' => 'correcciones_calificacion.aprobar',
                'coordinador_academico' => 'correcciones_calificacion.aprobar',
                'director_escuela' => 'correcciones_calificacion.autorizar',
            ],
            'solicitar_correccion_calificacion' => [
                'docente' => 'calificaciones.capturar_propias',
                'control_escolar_escuela' => 'calificaciones.capturar',
                'responsable_evaluacion' => 'calificaciones.revisar',
                'coordinador_academico' => 'calificaciones.ver',
            ],
            'enviar_revision_documento' => [
                'control_escolar_escuela' => 'documentos.enviar_revision',
            ],
            'crear_solicitud_documento' => [
                'control_escolar_escuela' => 'documentos.crear_borrador',
                'responsable_certificacion_titulacion' => 'documentos.generar_documento',
            ],
            'atender_observaciones' => [
                'control_escolar_escuela' => 'observaciones.atender',
            ],
            'aprobar_institucionalmente' => [
                'director_escuela' => 'documentos.aprobar_institucionalmente',
            ],
            'rechazar_institucionalmente' => [
                'director_escuela' => 'documentos.rechazar_institucionalmente',
            ],
            'validar_normativamente' => [
                'educacion_superior' => 'documentos.validar_normativamente',
            ],
            'liberar_proceso_tecnico' => [
                'educacion_superior' => 'documentos.liberar_proceso_tecnico',
                'responsable_certificacion_titulacion' => 'documentos.liberar_proceso_tecnico',
            ],
            'preparar_documento_certificacion' => [
                'responsable_certificacion_titulacion' => 'documentos.generar_documento',
            ],
            'ver_mi_expediente' => [
                'alumno_egresado' => 'expediente.ver_propio',
            ],
            'ver_mis_documentos' => [
                'alumno_egresado' => 'documentos.ver_propios',
            ],
            'ver_estado_admision' => [
                'aspirante_preinscrito' => 'admision.ver_estado_propio',
            ],
            'revisar_reportes_globales' => [
                'educacion_superior' => 'reportes_oficiales.ver',
                'director_escuela' => 'reportes.ver',
                'responsable_evaluacion' => 'reportes.ver',
                'coordinador_academico' => 'reportes.ver',
                'superadmin' => 'reportes.ver',
                'admin' => 'reportes.ver',
            ],
        ];

        return $matrix[$key][$role] ?? $fallback;
    }

    private function userMay(User $user, string $permission, string $role): bool
    {
        if (in_array($role, ['superadmin', 'admin'], true)) {
            return true;
        }

        return $user->can($permission);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function catalog(): array
    {
        return [
            'abrir_expediente' => [
                'label' => 'Abrir expediente',
                'description' => 'Consultar el expediente académico del alumno.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'ver_alumnos',
                'priority' => 10,
                'variant' => 'primary',
                'icon' => 'folder-open',
            ],
            'registrar_aspirante' => [
                'label' => 'Registrar aspirante',
                'description' => 'Alta de aspirante o preinscripción.',
                'route' => '/app/alumnos/crear',
                'method' => 'GET',
                'permission_required' => 'gestionar_alumnos',
                'priority' => 20,
                'variant' => 'primary',
                'icon' => 'user-plus',
            ],
            'completar_expediente' => [
                'label' => 'Completar expediente',
                'description' => 'Continuar la captura del expediente.',
                'route' => '/app/alumnos/captura-guiado',
                'method' => 'GET',
                'permission_required' => 'gestionar_alumnos',
                'priority' => 30,
                'variant' => 'secondary',
                'icon' => 'pencil-square',
            ],
            'preparar_solicitud_matricula' => [
                'label' => 'Preparar solicitud de matrícula',
                'description' => 'Editar borrador antes del envío a Educación Superior.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'GET',
                'permission_required' => 'crear_solicitud_matricula',
                'priority' => 40,
                'variant' => 'secondary',
                'icon' => 'document-text',
            ],
            'enviar_solicitud_matricula' => [
                'label' => 'Enviar solicitud de matrícula',
                'description' => 'Enviar a revisión institucional.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'POST',
                'permission_required' => 'enviar_solicitud_matricula',
                'priority' => 50,
                'variant' => 'primary',
                'icon' => 'paper-airplane',
            ],
            'atender_observacion_matricula' => [
                'label' => 'Atender observación de matrícula',
                'description' => 'Corregir y reenviar la solicitud observada.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'GET',
                'permission_required' => 'atender_observacion_solicitud_matricula',
                'priority' => 55,
                'variant' => 'warning',
                'icon' => 'chat-bubble-left-right',
            ],
            'ver_matricula_asignada' => [
                'label' => 'Ver matrícula asignada',
                'description' => 'Consultar detalle de la matrícula asignada.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'GET',
                'permission_required' => 'ver_solicitud_matricula',
                'priority' => 60,
                'variant' => 'secondary',
                'icon' => 'identification',
            ],
            'registrar_inscripcion' => [
                'label' => 'Registrar inscripción',
                'description' => 'Inscripción a periodo escolar.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'gestionar_inscripciones_periodo',
                'priority' => 70,
                'variant' => 'primary',
                'icon' => 'calendar-days',
            ],
            'registrar_reinscripcion' => [
                'label' => 'Registrar reinscripción',
                'description' => 'Reinscripción del alumno.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'gestionar_inscripciones_periodo',
                'priority' => 75,
                'variant' => 'secondary',
                'icon' => 'arrow-path',
            ],
            'generar_carga_academica' => [
                'label' => 'Generar carga académica',
                'description' => 'Asignación de materias al periodo.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'generar_carga_academica',
                'priority' => 80,
                'variant' => 'primary',
                'icon' => 'squares-2x2',
            ],
            'capturar_calificaciones' => [
                'label' => 'Capturar calificaciones',
                'description' => 'Captura o edición de calificaciones autorizada.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'gestionar_materias',
                'priority' => 90,
                'variant' => 'primary',
                'icon' => 'clipboard-document-check',
            ],
            'importar_calificaciones' => [
                'label' => 'Importar calificaciones',
                'description' => 'Carga masiva desde plantilla.',
                'route' => '/app/importaciones',
                'method' => 'GET',
                'permission_required' => 'importar_calificaciones',
                'priority' => 95,
                'variant' => 'secondary',
                'icon' => 'arrow-up-tray',
            ],
            'recalcular_trayectoria' => [
                'label' => 'Recalcular trayectoria',
                'description' => 'Recalcula trayectoria académica.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'recalcular_trayectoria',
                'priority' => 100,
                'variant' => 'warning',
                'icon' => 'arrow-path-rounded-square',
            ],
            'ver_kardex' => [
                'label' => 'Ver kardex',
                'description' => 'Historial académico consolidado.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'ver_alumnos',
                'priority' => 110,
                'variant' => 'secondary',
                'icon' => 'table-cells',
            ],
            'crear_solicitud_documento' => [
                'label' => 'Crear solicitud de documento',
                'description' => 'Solicitar constancia o certificado.',
                'route' => '/app/documentos/nuevo',
                'method' => 'GET',
                'permission_required' => 'crear_documentos',
                'priority' => 120,
                'variant' => 'primary',
                'icon' => 'document-plus',
            ],
            'enviar_revision_documento' => [
                'label' => 'Enviar a revisión',
                'description' => 'Envía el documento académico a revisión.',
                'route' => '/app/documentos/bandejas/por-enviar',
                'method' => 'GET',
                'permission_required' => 'enviar_revision',
                'priority' => 130,
                'variant' => 'primary',
                'icon' => 'paper-airplane',
            ],
            'atender_observaciones' => [
                'label' => 'Atender observaciones',
                'description' => 'Responder observaciones en documento o expediente.',
                'route' => '/app/documentos/observaciones',
                'method' => 'GET',
                'permission_required' => 'ver_documentos',
                'priority' => 140,
                'variant' => 'warning',
                'icon' => 'exclamation-triangle',
            ],
            'revisar_solicitud_matricula' => [
                'label' => 'Revisar solicitud de matrícula',
                'description' => 'Revisión normativa en sede rectora.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'GET',
                'permission_required' => 'revisar_solicitud_matricula',
                'priority' => 150,
                'variant' => 'primary',
                'icon' => 'magnifying-glass',
            ],
            'devolver_solicitud_matricula' => [
                'label' => 'Devolver con observaciones',
                'description' => 'Devolver solicitud a la escuela con observaciones.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'POST',
                'permission_required' => 'devolver_solicitud_matricula',
                'priority' => 160,
                'variant' => 'warning',
                'icon' => 'arrow-uturn-left',
            ],
            'rechazar_solicitud_matricula' => [
                'label' => 'Rechazar solicitud',
                'description' => 'Rechazo formal de la solicitud.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'POST',
                'permission_required' => 'rechazar_solicitud_matricula',
                'priority' => 170,
                'variant' => 'danger',
                'icon' => 'x-circle',
            ],
            'asignar_matricula' => [
                'label' => 'Asignar matrícula',
                'description' => 'Asignación oficial de matrícula SEP.',
                'route' => '/app/solicitudes-matricula',
                'method' => 'POST',
                'permission_required' => 'asignar_matricula',
                'priority' => 180,
                'variant' => 'success',
                'icon' => 'check-badge',
            ],
            'revisar_expediente' => [
                'label' => 'Revisar expediente',
                'description' => 'Revisión institucional del expediente académico (no validación normativa de Educación Superior).',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'ver_alumnos',
                'priority' => 190,
                'variant' => 'secondary',
                'icon' => 'eye',
            ],
            'validar_normativamente' => [
                'label' => 'Validar normativamente',
                'description' => 'Dictamen de cumplimiento normativo (autoridad académica central).',
                'route' => '/app/educacion-superior/validaciones-normativas',
                'method' => 'GET',
                'permission_required' => 'validaciones_normativas.revisar',
                'priority' => 200,
                'variant' => 'primary',
                'icon' => 'scale',
            ],
            'liberar_proceso_tecnico' => [
                'label' => 'Enviar a proceso técnico',
                'description' => 'Autoriza el siguiente paso hacia cadena/XML/firma; la ejecución técnica la realiza el área de Sistemas.',
                'route' => '/app/documentos/bandejas/aprobados',
                'method' => 'GET',
                'permission_required' => 'documentos.liberar_proceso_tecnico',
                'priority' => 210,
                'variant' => 'secondary',
                'icon' => 'lock-open',
            ],
            'revisar_reportes_globales' => [
                'label' => 'Reportes por institución',
                'description' => 'Indicadores y reportes institucionales.',
                'route' => '/app/admin/reportes-basicos',
                'method' => 'GET',
                'permission_required' => 'ver_catalogos',
                'priority' => 220,
                'variant' => 'secondary',
                'icon' => 'chart-bar',
            ],
            'aprobar_institucionalmente' => [
                'label' => 'Aprobar institucionalmente',
                'description' => 'Aprobación del director de escuela.',
                'route' => '/app/documentos/bandejas/en-revision',
                'method' => 'GET',
                'permission_required' => 'aprobar_documentos',
                'priority' => 230,
                'variant' => 'success',
                'icon' => 'hand-thumb-up',
            ],
            'rechazar_institucionalmente' => [
                'label' => 'Rechazar institucionalmente',
                'description' => 'Devolución u observación del director.',
                'route' => '/app/documentos/bandejas/en-revision',
                'method' => 'GET',
                'permission_required' => 'rechazar_documentos',
                'priority' => 240,
                'variant' => 'danger',
                'icon' => 'hand-thumb-down',
            ],
            'preparar_documento_certificacion' => [
                'label' => 'Preparar documento',
                'description' => 'Preparación hacia emisión (certificación/titulación).',
                'route' => '/app/documentos/bandejas/listos-para-firma',
                'method' => 'GET',
                'permission_required' => 'preparar_documento_firma',
                'priority' => 250,
                'variant' => 'primary',
                'icon' => 'document-check',
            ],
            'administrar_menus' => [
                'label' => 'Administrar menús',
                'description' => 'Configuración de menús por rol y permiso.',
                'route' => '/app/admin/menus',
                'method' => 'GET',
                'permission_required' => 'menus.administrar',
                'priority' => 5,
                'variant' => 'secondary',
                'icon' => 'bars-3-bottom-left',
            ],
            'ver_logs' => [
                'label' => 'Ver logs',
                'description' => 'Registros técnicos de integración.',
                'route' => '/app/sistemas/logs',
                'method' => 'GET',
                'permission_required' => 'ver_logs_integracion',
                'priority' => 10,
                'variant' => 'secondary',
                'icon' => 'server-stack',
            ],
            'ver_jobs' => [
                'label' => 'Ver jobs',
                'description' => 'Colas y trabajos en segundo plano.',
                'route' => '/app/sistemas/dashboard',
                'method' => 'GET',
                'permission_required' => 'ver_logs_integracion',
                'priority' => 15,
                'variant' => 'secondary',
                'icon' => 'queue-list',
            ],
            'reintentar_job' => [
                'label' => 'Reintentar job',
                'description' => 'Reintento de trabajo fallido (desde panel técnico).',
                'route' => '/app/sistemas/dashboard',
                'method' => 'POST',
                'permission_required' => 'ver_logs_integracion',
                'priority' => 20,
                'variant' => 'warning',
                'icon' => 'arrow-path',
            ],
            'configurar_integracion' => [
                'label' => 'Configurar integración',
                'description' => 'Parámetros de integraciones externas.',
                'route' => '/app/sistemas/configuracion',
                'method' => 'GET',
                'permission_required' => 'gestionar_reglas_cadena',
                'priority' => 25,
                'variant' => 'secondary',
                'icon' => 'cog-6-tooth',
            ],
            'generar_cadena' => [
                'label' => 'Generar cadena original',
                'description' => 'Vista técnica de cadena (sin XML productivo).',
                'route' => '/app/sistemas/configuracion',
                'method' => 'POST',
                'permission_required' => 'generar_cadena',
                'priority' => 30,
                'variant' => 'secondary',
                'icon' => 'link',
            ],
            'generar_xml' => [
                'label' => 'Generar / validar XML (técnico)',
                'description' => 'Flujo técnico de XML (no productivo).',
                'route' => '/app/sistemas/configuracion',
                'method' => 'POST',
                'permission_required' => 'generar_xml',
                'priority' => 35,
                'variant' => 'warning',
                'icon' => 'code-bracket',
            ],
            'validar_xml' => [
                'label' => 'Validar XML',
                'description' => 'Validación técnica de estructura.',
                'route' => '/app/sistemas/configuracion',
                'method' => 'POST',
                'permission_required' => 'ver_xml',
                'priority' => 36,
                'variant' => 'secondary',
                'icon' => 'shield-check',
            ],
            'ejecutar_firma_tecnica' => [
                'label' => 'Ejecutar firma técnica',
                'description' => 'Orquestación de firma en entorno controlado.',
                'route' => '/app/sistemas/configuracion',
                'method' => 'POST',
                'permission_required' => 'solicitar_firma',
                'priority' => 40,
                'variant' => 'warning',
                'icon' => 'pencil-square',
            ],
            'generar_pdf' => [
                'label' => 'Generar PDF (técnico)',
                'description' => 'Generación de PDF en flujo técnico.',
                'route' => '/app/sistemas/configuracion',
                'method' => 'POST',
                'permission_required' => 'generar_pdf',
                'priority' => 45,
                'variant' => 'secondary',
                'icon' => 'document-arrow-down',
            ],
            'ver_auditoria_tecnica' => [
                'label' => 'Auditoría técnica',
                'description' => 'Trazabilidad técnica del documento.',
                'route' => '/app/sistemas/logs',
                'method' => 'GET',
                'permission_required' => 'ver_auditoria',
                'priority' => 50,
                'variant' => 'secondary',
                'icon' => 'clipboard-document-list',
            ],
            'ver_auditoria_consulta' => [
                'label' => 'Consultar auditoría',
                'description' => 'Solo lectura de eventos de auditoría.',
                'route' => '/app/auditoria/dashboard',
                'method' => 'GET',
                'permission_required' => 'ver_auditoria',
                'priority' => 5,
                'variant' => 'secondary',
                'icon' => 'eye',
            ],
            'ver_documentos_consulta' => [
                'label' => 'Consultar documentos',
                'description' => 'Listado documental en modo lectura.',
                'route' => '/app/consulta/documentos',
                'method' => 'GET',
                'permission_required' => 'ver_documentos',
                'priority' => 10,
                'variant' => 'secondary',
                'icon' => 'document-magnifying-glass',
            ],
            'ver_expediente_consulta' => [
                'label' => 'Consultar expediente',
                'description' => 'Vista de expediente sin edición.',
                'route' => '/app/expedientes',
                'method' => 'GET',
                'permission_required' => 'ver_alumnos',
                'priority' => 15,
                'variant' => 'secondary',
                'icon' => 'folder',
            ],
            'ver_mi_expediente' => [
                'label' => 'Mi expediente',
                'description' => 'Portal del alumno.',
                'route' => '/app/dashboard',
                'method' => 'GET',
                'permission_required' => 'portal.ver',
                'priority' => 5,
                'variant' => 'primary',
                'icon' => 'user',
            ],
            'ver_mis_documentos' => [
                'label' => 'Mis documentos',
                'description' => 'Documentos disponibles en portal.',
                'route' => '/app/dashboard',
                'method' => 'GET',
                'permission_required' => 'portal.ver',
                'priority' => 15,
                'variant' => 'secondary',
                'icon' => 'document-text',
            ],
            'ver_estado_admision' => [
                'label' => 'Estado de admisión',
                'description' => 'Seguimiento del proceso de admisión.',
                'route' => '/app/dashboard',
                'method' => 'GET',
                'permission_required' => 'admision.portal',
                'priority' => 5,
                'variant' => 'primary',
                'icon' => 'academic-cap',
            ],
            'actualizar_mis_datos_admision' => [
                'label' => 'Actualizar mis datos',
                'description' => 'Edita la información de tu preinscripción.',
                'route' => '/app/dashboard',
                'method' => 'GET',
                'permission_required' => 'aspirantes.editar_propio',
                'priority' => 10,
                'variant' => 'secondary',
                'icon' => 'pencil-square',
            ],
            'acceder_panel_docente' => [
                'label' => 'Ir a mi panel docente',
                'description' => 'Grupos, materias y calificaciones asignadas.',
                'route' => '/app/docente/dashboard',
                'method' => 'GET',
                'permission_required' => 'dashboard.ver',
                'priority' => 12,
                'variant' => 'primary',
                'icon' => 'rectangle-group',
            ],
            'solicitar_correccion_calificacion' => [
                'label' => 'Solicitar corrección',
                'description' => 'Solicitud de corrección de calificación cerrada.',
                'route' => '/app/coordinador/dashboard',
                'method' => 'GET',
                'permission_required' => 'gestionar_materias',
                'priority' => 300,
                'variant' => 'warning',
                'icon' => 'wrench-screwdriver',
            ],
            'aprobar_correccion_calificacion' => [
                'label' => 'Aprobar corrección',
                'description' => 'Aprueba solicitud de corrección de calificación.',
                'route' => '/app/coordinador/dashboard',
                'method' => 'POST',
                'permission_required' => 'gestionar_materias',
                'priority' => 310,
                'variant' => 'success',
                'icon' => 'check',
            ],
            'rechazar_correccion_calificacion' => [
                'label' => 'Rechazar corrección',
                'description' => 'Rechaza solicitud de corrección de calificación.',
                'route' => '/app/coordinador/dashboard',
                'method' => 'POST',
                'permission_required' => 'gestionar_materias',
                'priority' => 320,
                'variant' => 'danger',
                'icon' => 'x-mark',
            ],
        ];
    }
}
