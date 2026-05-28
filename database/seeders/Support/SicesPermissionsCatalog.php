<?php

declare(strict_types=1);

namespace Database\Seeders\Support;

/**
 * Catálogo modular (dominio.acción) + permisos legacy ya usados en rutas/policies.
 * Los roles sincronizan legacy + modular + paridad automática (ver mapeo).
 */
final class SicesPermissionsCatalog
{
    /**
     * Permisos legacy existentes en la app (rutas, policies, requests).
     *
     * @return list<string>
     */
    public static function legacyPermissions(): array
    {
        return [
            'ver_catalogos',
            'gestionar_catalogos',
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
            'ver_claves_legacy_catalogos',
            'ver_alumnos',
            'gestionar_alumnos',
            'ver_matriculas',
            'gestionar_matriculas',
            'ver_solicitud_matricula',
            'crear_solicitud_matricula',
            'enviar_solicitud_matricula',
            'atender_observacion_solicitud_matricula',
            'revisar_solicitud_matricula',
            'aprobar_solicitud_matricula',
            'rechazar_solicitud_matricula',
            'devolver_solicitud_matricula',
            'asignar_matricula',
            'ver_materias',
            'gestionar_materias',
            'gestionar_planes_estudio',
            'gestionar_plan_materias',
            'gestionar_inscripciones_periodo',
            'generar_carga_academica',
            'importar_calificaciones',
            'forzar_importacion_historica_sin_plan_materia',
            'emitir_certificado_oficial_legacy_sin_validacion_normativa',
            'revisar_importacion_legacy_normativa',
            'aprobar_importacion_legacy_normativa',
            'rechazar_importacion_legacy_normativa',
            'validar_materias_cursadas',
            'recalcular_trayectoria',
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
            'ver_logs_integracion',
            'ver_auditoria',
            'ver_historial_estados',
        ];
    }

    /**
     * Dominios modulares (dominio.acción) para generar el catálogo base.
     *
     * @return list<string>
     */
    public static function moduleDomains(): array
    {
        return [
            'dashboard', 'usuarios', 'roles', 'permisos', 'menus', 'catalogos', 'subsistemas',
            'instituciones', 'sedes', 'municipios', 'programas', 'planes_estudio', 'materias',
            'ofertas_academicas', 'aspirantes', 'admision', 'alumnos', 'expedientes', 'solicitudes_matricula',
            'matriculas', 'inscripciones', 'reinscripciones', 'grupos', 'docentes', 'carga_academica',
            'calificaciones', 'actas', 'correcciones_calificacion', 'importaciones_academicas', 'trayectoria',
            'kardex', 'documentos', 'certificacion', 'titulacion', 'folios', 'cadena_original', 'xml', 'firma',
            'pdf', 'consulta_publica', 'observaciones', 'reportes', 'auditoria', 'logs', 'jobs', 'integraciones',
            'configuracion', 'validacion_normativa', 'portal', 'perfil', 'expediente', 'constancias', 'tramites',
            'exportar_reportes',
            'indicadores', 'egreso', 'autorizaciones', 'notificaciones',
            'validaciones_normativas', 'reportes_oficiales',
        ];
    }

    /**
     * Acciones base para el grid canónico (además de permisos especiales en roles).
     *
     * @return list<string>
     */
    public static function moduleActions(): array
    {
        return [
            'ver', 'crear', 'editar', 'eliminar', 'enviar', 'revisar', 'validar', 'autorizar', 'aprobar',
            'rechazar', 'cancelar', 'asignar', 'importar', 'exportar', 'generar', 'firmar', 'auditar',
            'configurar', 'administrar', 'corregir', 'cerrar', 'cargar', 'recalcular', 'atender', 'devolver',
            'liberar_proceso_tecnico', 'aprobar_institucionalmente', 'rechazar_institucionalmente',
            'validar_normativamente', 'crear_borrador', 'enviar_revision', 'generar_documento', 'reponer',
            'cargar_propios', 'ver_propios', 'ver_propias', 'capturar_propias', 'ver_grupo',
            'ver_propio', 'registro_propio', 'editar_propio', 'ver_estado_propio',
            'aprobar_academicamente', 'ver_parcial', 'ver_lectura', 'solicitar', 'ejecutar', 'reintentar',
            'atender_observaciones', 'capturar', 'observar', 'suspender',
            'autorizar_emision', 'enviar_a_proceso_tecnico',
        ];
    }

    /**
     * Permisos modulares del grid dominio × acción (deduplicados con roles/paridad).
     *
     * @return list<string>
     */
    public static function cartesianModularPermissions(): array
    {
        $out = [];
        foreach (self::moduleDomains() as $domain) {
            foreach (self::moduleActions() as $action) {
                $out[] = $domain.'.'.$action;
            }
        }

        return $out;
    }

    /**
     * Valores modulares referenciados en paridad u otros sitios que no encajan en el grid.
     *
     * @return list<string>
     */
    public static function parityModularValues(): array
    {
        $flat = [];
        foreach (self::legacyToModularParity() as $targets) {
            $flat = array_merge($flat, $targets);
        }

        return array_values(array_unique($flat));
    }

    /**
     * Todos los nombres de permiso a registrar en BD (legacy + modulares).
     *
     * @return list<string>
     */
    public static function allRegisterablePermissionNames(): array
    {
        return array_values(array_unique(array_merge(
            self::legacyPermissions(),
            self::cartesianModularPermissions(),
            self::parityModularValues(),
            self::modularPermissions(),
            [
                'documentos.aprobar_academicamente',
                'validacion_normativa.aprobar',
                'asistencia.capturar',
                'solicitudes_matricula.devolver',
                'inscripciones.autorizar_excepcion',
                'reinscripciones.autorizar_excepcion',
                'apariencia_sistema.ver',
                'apariencia_sistema.administrar',
                'apariencia_sistema.editar',
                'apariencia_sistema.publicar',
                'apariencia_sistema.restaurar',
                'apariencia_sistema.subir_imagenes',
                'consulta_publica.emitir_token',
                'documentos.validar',
                'documentos.validar_documentalmente',
                'documentos.liberar_proceso_tecnico',
                'firma.reintentar',
                'firma.preflight',
                'sistemas.integraciones.ver',
            ],
        )));
    }

    public static function modularPermissions(): array
    {
        $fromRoles = [];
        foreach (self::modularPermissionsByRole() as $perms) {
            $fromRoles = array_merge($fromRoles, $perms);
        }

        $extra = [
            'sices_legacy.consultar',
            'sices_legacy.health',
            'sices_legacy.comparar',
            'sices_legacy.exportar',
            'control_escolar.importar',
            'certificacion.preparar',
            'observaciones.crear',
            'documentos.observar',
            'documentos.aprobar_academicamente',
            'validacion_normativa.aprobar',
            'asistencia.capturar',
            'apariencia_sistema.ver',
            'apariencia_sistema.administrar',
            'apariencia_sistema.editar',
            'apariencia_sistema.publicar',
            'apariencia_sistema.restaurar',
            'apariencia_sistema.subir_imagenes',
        ];

        return array_values(array_unique(array_merge(
            $fromRoles,
            $extra,
            self::parityModularValues(),
        )));
    }

    /**
     * @return array<string, list<string>>
     */
    public static function modularPermissionsByRole(): array
    {
        return [
            'sistemas' => [
                'usuarios.ver', 'usuarios.crear', 'usuarios.editar',
                'roles.ver',
                'permisos.ver',
                'menus.ver', 'menus.administrar',
                'catalogos.ver', 'catalogos.configurar',
                'configuracion.ver', 'configuracion.configurar',
                'logs.ver',
                'jobs.ver', 'jobs.reintentar',
                'integraciones.ver', 'integraciones.configurar',
                'sices_legacy.consultar', 'sices_legacy.health', 'sices_legacy.comparar', 'sices_legacy.exportar',
                'auditoria.ver',
                'cadena_original.generar',
                'xml.ver', 'xml.generar', 'xml.validar',
                'firma.ver', 'firma.ejecutar', 'firma.reintentar', 'firma.preflight',
                'sistemas.integraciones.ver',
                'pdf.generar',
                'ver_documentos',
                'consulta_publica.configurar',
                'reportes.ver',
                'dashboard.ver',
                'apariencia_sistema.ver',
                'apariencia_sistema.administrar',
                'apariencia_sistema.editar',
                'apariencia_sistema.publicar',
                'apariencia_sistema.restaurar',
                'apariencia_sistema.subir_imagenes',
            ],
            'educacion_superior' => [
                'dashboard.ver',
                'certificacion.preparar',
                'control_escolar.importar',
                'observaciones.crear',
                'documentos.observar',
                'instituciones.ver', 'instituciones.crear', 'instituciones.editar', 'instituciones.suspender',
                'sedes.ver', 'sedes.crear', 'sedes.editar', 'sedes.validar',
                'programas.ver', 'programas.crear', 'programas.editar',
                'planes_estudio.ver', 'planes_estudio.crear', 'planes_estudio.editar', 'planes_estudio.aprobar',
                'ofertas_academicas.ver',
                'expedientes.ver',
                'solicitudes_matricula.ver', 'solicitudes_matricula.revisar', 'solicitudes_matricula.aprobar',
                'solicitudes_matricula.observar', 'solicitudes_matricula.rechazar', 'solicitudes_matricula.devolver',
                'matriculas.asignar',
                'validaciones_normativas.ver', 'validaciones_normativas.revisar', 'validaciones_normativas.aprobar',
                'validaciones_normativas.observar', 'validaciones_normativas.rechazar',
                'documentos.ver', 'documentos.aprobar', 'documentos.rechazar',
                'documentos.aprobar_institucionalmente', 'documentos.rechazar_institucionalmente',
                'documentos.observar', 'documentos.validar_normativamente', 'documentos.liberar_proceso_tecnico',
                'certificacion.ver', 'certificacion.validar', 'certificacion.autorizar_emision', 'certificacion.enviar_a_proceso_tecnico',
                'folios.ver',
                'reportes.ver', 'reportes_oficiales.ver', 'reportes_oficiales.generar',
                'consulta_publica.ver',
                'notificaciones.ver',
                'importaciones_academicas.ver',
                'sices_legacy.consultar',
                'sices_legacy.health',
                'sices_legacy.comparar',
            ],
            'director_escuela' => [
                'dashboard.ver',
                'indicadores.ver',
                'alumnos.ver',
                'expedientes.ver', 'expedientes.revisar',
                'inscripciones.ver', 'inscripciones.revisar', 'inscripciones.autorizar_excepcion',
                'reinscripciones.ver', 'reinscripciones.revisar', 'reinscripciones.autorizar_excepcion',
                'calificaciones.ver', 'calificaciones.revisar',
                'actas.ver',
                'correcciones_calificacion.autorizar',
                'certificacion.ver',
                'titulacion.ver',
                'egreso.ver', 'egreso.revisar', 'egreso.aprobar_institucionalmente',
                'documentos.ver', 'documentos.revisar', 'documentos.aprobar_institucionalmente',
                'documentos.rechazar_institucionalmente', 'documentos.observar',
                'observaciones.ver', 'observaciones.crear',
                'autorizaciones.ver',
                'reportes.ver',
                'notificaciones.ver',
                'trayectoria.ver', 'kardex.ver',
            ],
            'control_escolar_escuela' => [
                'dashboard.ver',
                'control_escolar.importar',
                'notificaciones.ver',
                'aspirantes.ver', 'aspirantes.crear', 'aspirantes.editar',
                'expedientes.ver', 'expedientes.crear', 'expedientes.editar',
                'alumnos.ver', 'alumnos.crear', 'alumnos.editar',
                'solicitudes_matricula.crear', 'solicitudes_matricula.enviar', 'solicitudes_matricula.atender_observaciones',
                'matriculas.ver',
                'inscripciones.ver', 'inscripciones.crear', 'inscripciones.editar',
                'reinscripciones.ver', 'reinscripciones.crear',
                'carga_academica.ver', 'carga_academica.generar',
                'calificaciones.ver', 'calificaciones.capturar',
                'importaciones_academicas.ver', 'importaciones_academicas.crear', 'importaciones_academicas.importar',
                'trayectoria.ver', 'trayectoria.recalcular',
                'kardex.ver',
                'documentos.ver', 'documentos.crear_borrador', 'documentos.enviar_revision',
                'observaciones.ver', 'observaciones.atender',
                'reportes.ver',
                'sices_legacy.consultar',
            ],
            'responsable_admision' => [
                'aspirantes.ver', 'aspirantes.crear', 'aspirantes.editar',
                'admision.ver', 'admision.revisar', 'admision.aprobar', 'admision.rechazar',
                'expedientes.ver',
                'documentos.ver', 'documentos.cargar',
                'observaciones.ver', 'observaciones.crear',
            ],
            'responsable_evaluacion' => [
                'dashboard.ver',
                'grupos.ver', 'docentes.ver',
                'carga_academica.ver',
                'calificaciones.ver', 'calificaciones.capturar', 'calificaciones.revisar', 'calificaciones.cerrar',
                'correcciones_calificacion.ver', 'correcciones_calificacion.aprobar',
                'actas.ver', 'actas.generar',
                'reportes.ver',
            ],
            'responsable_certificacion_titulacion' => [
                'dashboard.ver',
                'certificacion.ver', 'certificacion.revisar', 'certificacion.validar', 'certificacion.preparar',
                'notificaciones.ver',
                'control_escolar.importar',
                'observaciones.crear',
                'documentos.observar',
                'titulacion.ver', 'titulacion.revisar',
                'folios.ver', 'folios.asignar',
                'documentos.ver', 'documentos.validar', 'documentos.validar_documentalmente',
                'documentos.generar_documento', 'documentos.cancelar', 'documentos.reponer',
                'documentos.liberar_proceso_tecnico',
                'cadena_original.ver',
                'xml.ver',
                'pdf.ver',
                'consulta_publica.ver', 'consulta_publica.emitir_token',
                'reportes.ver',
                'sices_legacy.consultar',
                'sices_legacy.health',
                'sices_legacy.comparar',
            ],
            'docente' => [
                'grupos.ver_propios',
                'materias.ver_propias',
                'alumnos.ver_grupo',
                'calificaciones.capturar_propias',
                'asistencia.capturar',
                'actas.ver_propias',
                'dashboard.ver',
            ],
            'auditor' => [
                'dashboard.ver',
                'expedientes.ver',
                'documentos.ver',
                'certificacion.ver',
                'reportes.ver',
                'auditoria.ver',
                'logs.ver_lectura',
                'integraciones.ver',
                'sices_legacy.consultar',
                'sices_legacy.health',
                'exportar_reportes',
            ],
            'alumno_egresado' => [
                'portal.ver',
                'perfil.ver',
                'expediente.ver_propio',
                'calificaciones.ver_propias',
                'kardex.ver_propio',
                'documentos.ver_propios',
                'constancias.solicitar',
                'tramites.ver_propios',
            ],
            'aspirante_preinscrito' => [
                'admision.portal',
                'aspirantes.registro_propio',
                'aspirantes.editar_propio',
                'documentos.cargar_propios',
                'admision.ver_estado_propio',
                'observaciones.ver_propias',
            ],
            'consulta' => [
                'dashboard.ver',
                'documentos.ver',
            ],
            'coordinador_academico' => [
                'dashboard.ver',
                'alumnos.ver',
                'materias.ver',
                'matriculas.ver',
                'calificaciones.ver',
            ],
        ];
    }

    /**
     * Paridad: por cada permiso legacy del rol, se añaden equivalentes modulares usados en policies duales.
     *
     * @return array<string, list<string>>
     */
    public static function legacyToModularParity(): array
    {
        return [
            'ver_catalogos' => ['catalogos.ver', 'dashboard.ver'],
            'gestionar_catalogos' => ['catalogos.editar', 'catalogos.configurar'],
            'ver_alumnos' => ['alumnos.ver', 'expedientes.ver'],
            'gestionar_alumnos' => ['alumnos.crear', 'alumnos.editar', 'expedientes.editar'],
            'ver_matriculas' => ['matriculas.ver'],
            'gestionar_matriculas' => ['inscripciones.editar'],
            'asignar_matricula' => ['matriculas.asignar'],
            'crear_solicitud_matricula' => ['solicitudes_matricula.crear'],
            'enviar_solicitud_matricula' => ['solicitudes_matricula.enviar'],
            'atender_observacion_solicitud_matricula' => ['solicitudes_matricula.atender_observaciones'],
            'revisar_solicitud_matricula' => ['solicitudes_matricula.revisar'],
            'aprobar_solicitud_matricula' => ['solicitudes_matricula.aprobar'],
            'rechazar_solicitud_matricula' => ['solicitudes_matricula.rechazar'],
            'devolver_solicitud_matricula' => ['solicitudes_matricula.devolver'],
            'ver_solicitud_matricula' => ['solicitudes_matricula.ver'],
            'ver_materias' => ['materias.ver'],
            'gestionar_materias' => ['calificaciones.capturar', 'materias.editar'],
            'gestionar_inscripciones_periodo' => ['inscripciones.crear', 'inscripciones.editar'],
            'generar_carga_academica' => ['carga_academica.generar'],
            'importar_calificaciones' => ['importaciones_academicas.importar'],
            'recalcular_trayectoria' => ['trayectoria.recalcular'],
            'ver_trayectorias' => ['trayectoria.ver'],
            'gestionar_trayectorias' => ['trayectoria.editar'],
            'ver_documentos' => ['documentos.ver'],
            'crear_documentos' => ['documentos.crear', 'documentos.crear_borrador'],
            'editar_documentos' => ['documentos.editar'],
            'enviar_revision' => ['documentos.enviar_revision'],
            'aprobar_documentos' => ['documentos.aprobar', 'documentos.aprobar_institucionalmente'],
            'rechazar_documentos' => ['documentos.rechazar', 'documentos.rechazar_institucionalmente'],
            'cancelar_documentos' => ['documentos.cancelar'],
            'preparar_documento_firma' => ['documentos.enviar_revision', 'documentos.liberar_proceso_tecnico', 'consulta_publica.emitir_token'],
            'solicitar_firma' => ['firma.ejecutar'],
            'reintentar_firma' => ['firma.reintentar'],
            'ver_logs_integracion' => ['logs.ver'],
            'ver_auditoria' => ['auditoria.ver'],
            'generar_cadena' => ['cadena_original.generar'],
            'generar_xml' => ['xml.generar'],
            'ver_xml' => ['xml.ver'],
            'generar_pdf' => ['pdf.generar'],
            'ver_pdf' => ['pdf.ver'],
            'revisar_importacion_legacy_normativa' => ['importaciones_academicas.ver'],
            'aprobar_importacion_legacy_normativa' => ['importaciones_academicas.importar'],
            'rechazar_importacion_legacy_normativa' => ['importaciones_academicas.ver'],
        ];
    }

    /**
     * @param  list<string>  $legacySubset
     * @return list<string>
     */
    public static function expandParityForLegacy(array $legacySubset): array
    {
        $map = self::legacyToModularParity();
        $out = [];
        foreach ($legacySubset as $legacy) {
            if (isset($map[$legacy])) {
                $out = array_merge($out, $map[$legacy]);
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * Permisos legacy por rol (compatibilidad con rutas actuales).
     *
     * @return array<string, list<string>>
     */
    public static function legacyPermissionsByRole(): array
    {
        $controlEscolarEscuela = [
            'ver_catalogos',
            'ver_alumnos',
            'gestionar_alumnos',
            'ver_matriculas',
            'gestionar_matriculas',
            'ver_solicitud_matricula',
            'crear_solicitud_matricula',
            'enviar_solicitud_matricula',
            'atender_observacion_solicitud_matricula',
            'ver_materias',
            'gestionar_materias',
            'gestionar_inscripciones_periodo',
            'generar_carga_academica',
            'importar_calificaciones',
            'validar_materias_cursadas',
            'recalcular_trayectoria',
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
        ];

        $educacionSuperior = [
            'ver_catalogos',
            'ver_alumnos',
            'ver_matriculas',
            'ver_solicitud_matricula',
            'revisar_solicitud_matricula',
            'aprobar_solicitud_matricula',
            'rechazar_solicitud_matricula',
            'devolver_solicitud_matricula',
            'asignar_matricula',
            'ver_materias',
            'validar_materias_cursadas',
            'ver_trayectorias',
            'ver_documentos',
            'aprobar_documentos',
            'rechazar_documentos',
            'ver_historial_estados',
            'revisar_importacion_legacy_normativa',
            'aprobar_importacion_legacy_normativa',
            'rechazar_importacion_legacy_normativa',
        ];

        $sistemas = [
            'ver_catalogos',
            'ver_claves_legacy_catalogos',
            'ver_documentos',
            'preparar_documento_firma',
            'generar_cadena',
            'generar_xml',
            'ver_xml',
            'generar_pdf',
            'solicitar_firma',
            'reintentar_firma',
            'gestionar_configuracion_firma',
            'gestionar_plantillas_documentos',
            'gestionar_reglas_cadena',
            'gestionar_plantillas_xml',
            'ver_logs_integracion',
            'ver_auditoria',
            'ver_historial_estados',
        ];

        $responsableCertificacion = [
            'ver_documentos',
            'preparar_documento_firma',
        ];

        $admin = [
            'ver_catalogos',
            'gestionar_catalogos',
            'gestionar_planes_estudio',
            'gestionar_plan_materias',
            'ver_alumnos',
            'gestionar_alumnos',
            'ver_matriculas',
            'gestionar_matriculas',
            'ver_solicitud_matricula',
            'crear_solicitud_matricula',
            'enviar_solicitud_matricula',
            'atender_observacion_solicitud_matricula',
            'revisar_solicitud_matricula',
            'aprobar_solicitud_matricula',
            'rechazar_solicitud_matricula',
            'devolver_solicitud_matricula',
            'asignar_matricula',
            'ver_materias',
            'gestionar_materias',
            'gestionar_inscripciones_periodo',
            'generar_carga_academica',
            'importar_calificaciones',
            'validar_materias_cursadas',
            'recalcular_trayectoria',
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

        return [
            'admin' => $admin,
            'control_escolar_escuela' => $controlEscolarEscuela,
            'director_escuela' => $directorEscuela,
            'educacion_superior' => $educacionSuperior,
            'sistemas' => $sistemas,
            'docente' => [],
            'coordinador_academico' => [
                'ver_catalogos',
                'ver_alumnos',
                'ver_materias',
                'ver_matriculas',
            ],
            'auditor' => [
                'ver_auditoria',
                'ver_logs_integracion',
                'ver_historial_estados',
                'ver_documentos',
                'ver_catalogos',
                'certificacion.ver',
            ],
            'consulta' => [
                'ver_documentos',
            ],
            'responsable_admision' => [],
            'responsable_evaluacion' => [],
            'responsable_certificacion_titulacion' => $responsableCertificacion,
            'alumno_egresado' => [],
            'aspirante_preinscrito' => [],
        ];
    }

    /**
     * @return list<string>
     */
    public static function forbiddenForSistemas(): array
    {
        return [
            'matriculas.asignar',
            'asignar_matricula',
            'calificaciones.capturar',
            'calificaciones.capturar_propias',
            'gestionar_materias',
            'importar_calificaciones',
            'documentos.aprobar_academicamente',
            'documentos.aprobar',
            'documentos.aprobar_institucionalmente',
            'solicitudes_matricula.aprobar',
            'aprobar_solicitud_matricula',
            'aprobar_importacion_legacy_normativa',
            'validacion_normativa.aprobar',
        ];
    }

    /**
     * @return list<string>
     */
    public static function forbiddenForControlEscolarEscuela(): array
    {
        return [
            'matriculas.asignar',
            'asignar_matricula',
            'solicitudes_matricula.aprobar',
            'solicitudes_matricula.rechazar',
            'aprobar_solicitud_matricula',
            'rechazar_solicitud_matricula',
            'documentos.validar_normativamente',
            'documentos.liberar_proceso_tecnico',
            'apariencia_sistema.administrar',
            'menus.administrar',
            'roles.administrar',
            'permisos.administrar',
            'xml.generar',
            'xml.ver',
            'firma.ejecutar',
            'firma.ver',
            'logs.ver',
            'jobs.ver',
            'integraciones.ver',
            'cadena_original.generar',
        ];
    }

    /**
     * Dirección de escuela: supervisión y autorización institucional, sin operación técnica ni matrícula.
     *
     * @return list<string>
     */
    public static function forbiddenForDirectorEscuela(): array
    {
        return [
            'matriculas.asignar',
            'asignar_matricula',
            'solicitudes_matricula.aprobar',
            'solicitudes_matricula.rechazar',
            'solicitudes_matricula.crear',
            'solicitudes_matricula.enviar',
            'aprobar_solicitud_matricula',
            'rechazar_solicitud_matricula',
            'calificaciones.capturar',
            'calificaciones.capturar_propias',
            'importaciones_academicas.importar',
            'importaciones_academicas.crear',
            'importar_calificaciones',
            'gestionar_materias',
            'xml.generar',
            'xml.ver',
            'firma.ejecutar',
            'firma.ver',
            'logs.ver',
            'jobs.ver',
            'integraciones.ver',
            'integraciones.configurar',
            'menus.administrar',
            'apariencia_sistema.administrar',
            'documentos.validar_normativamente',
            'documentos.liberar_proceso_tecnico',
            'preparar_documento_firma',
            'generar_cadena',
            'generar_xml',
            'revisar_importacion_legacy_normativa',
            'aprobar_importacion_legacy_normativa',
            'rechazar_importacion_legacy_normativa',
            'roles.administrar',
            'permisos.administrar',
        ];
    }

    /**
     * @param  list<string>  $permissionNames
     * @return list<string>
     */
    public static function mergeRolePermissions(string $roleName): array
    {
        $legacy = self::legacyPermissionsByRole()[$roleName] ?? [];
        $modular = self::modularPermissionsByRole()[$roleName] ?? [];
        $merged = array_values(array_unique(array_merge(
            $legacy,
            $modular,
            self::expandParityForLegacy($legacy),
        )));

        if ($roleName === 'sistemas') {
            $merged = array_values(array_diff($merged, self::forbiddenForSistemas()));
        }

        if ($roleName === 'control_escolar_escuela') {
            $merged = array_values(array_diff($merged, self::forbiddenForControlEscolarEscuela()));
        }

        if ($roleName === 'director_escuela') {
            $merged = array_values(array_diff($merged, self::forbiddenForDirectorEscuela()));
        }

        if ($roleName === 'educacion_superior') {
            $merged = array_values(array_diff($merged, self::forbiddenForEducacionSuperior()));
        }

        if ($roleName === 'responsable_certificacion_titulacion') {
            $merged = array_values(array_diff($merged, self::forbiddenForResponsableCertificacionTitulacion()));
        }

        return $merged;
    }

    /**
     * Certificación funcional: sin operación técnica SEP/XML/cadena.
     *
     * @return list<string>
     */
    public static function forbiddenForResponsableCertificacionTitulacion(): array
    {
        return [
            'generar_cadena',
            'generar_xml',
            'generar_pdf',
            'solicitar_firma',
            'reintentar_firma',
            'cadena_original.generar',
            'xml.generar',
            'firma.ejecutar',
            'firma.ver',
            'pdf.generar',
            'integraciones.ver',
            'integraciones.configurar',
            'jobs.ver',
            'jobs.reintentar',
            'logs.ver',
            'menus.administrar',
        ];
    }

    /**
     * Educación Superior: autoridad académica sin operación técnica de Sistemas.
     *
     * @return list<string>
     */
    public static function forbiddenForEducacionSuperior(): array
    {
        return [
            'xml.generar',
            'xml.ver',
            'firma.ejecutar',
            'firma.ver',
            'jobs.ver',
            'jobs.reintentar',
            'logs.ver',
            'logs.ver_lectura',
            'ver_logs_integracion',
            'menus.administrar',
            'apariencia_sistema.administrar',
            'apariencia_sistema.ver',
            'apariencia_sistema.editar',
            'apariencia_sistema.publicar',
            'apariencia_sistema.restaurar',
            'apariencia_sistema.subir_imagenes',
            'roles.administrar',
            'permisos.administrar',
            'integraciones.ver',
            'integraciones.configurar',
            'cadena_original.generar',
            'ver_claves_legacy_catalogos',
            'generar_cadena',
            'generar_xml',
            'ver_xml',
            'gestionar_configuracion_firma',
            'gestionar_plantillas_xml',
            'auditoria.ver',
            'auditoria.ver_parcial',
        ];
    }
}
