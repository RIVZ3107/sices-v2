<?php

declare(strict_types=1);

/**
 * Esquema SISEES (dump local mysql_sisees_legacy). Sin tablas e11*.
 */
return [

    'connection' => 'mysql_sisees_legacy',

    'blocked_hosts' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('SICEES_LEGACY_BLOCKED_HOSTS', 'prod,production,sisees.sep.gob.mx,sisees.production')),
    ))),

    'blocked_databases' => array_values(array_filter(array_map(
        'strtolower',
        array_map('trim', explode(',', (string) env('SICEES_LEGACY_BLOCKED_DATABASES', 'sisees,sisees_prod,sisees_production'))),
    ))),

    'required_local_database' => env('SICEES_LEGACY_REQUIRED_DATABASE', 'sisees_legacy'),

    /** Tablas del dump SISEES confirmadas */
    'tables' => [
        'institucion' => env('SICEES_LEGACY_TABLE_INSTITUCION', 'institucion'),
        'oferta_educativa' => env('SICEES_LEGACY_TABLE_OFERTA_EDUCATIVA', 'oferta_educativa'),
        'programa_estudios' => env('SICEES_LEGACY_TABLE_PROGRAMA_ESTUDIOS', 'programa_estudios'),
        'plan_estudios' => env('SICEES_LEGACY_TABLE_PLAN_ESTUDIOS', 'plan_estudios'),
        'materia' => env('SICEES_LEGACY_TABLE_MATERIA', 'materia'),
        'periodo_programa_estudios' => env('SICEES_LEGACY_TABLE_PERIODO_PROGRAMA', 'periodo_programa_estudios'),
        'materia_periodo' => env('SICEES_LEGACY_TABLE_MATERIA_PERIODO', 'materia_periodo'),
        'programa_estudios_institucion' => env('SICEES_LEGACY_TABLE_PROGRAMA_INSTITUCION', 'programa_estudios_institucion'),
        'modalidad' => env('SICEES_LEGACY_TABLE_MODALIDAD', 'modalidad'),
        'turno' => env('SICEES_LEGACY_TABLE_TURNO', 'turno'),
    ],

    'forbidden_table_patterns' => [
        'alumno', 'alumnos', 'estudiante', 'curp', 'calificacion', 'documento', 'certificado',
        'usuario', 'matricula', 'inscripcion', 'trayectoria',
    ],

    /** tipo_institucion en dump SISEES */
    'tipo_institucion_principal' => 1,
    'tipo_institucion_sede' => 2,

    /**
     * clave_institucion numérica → subsistema (opcional; si no coincide, NORMAL).
     *
     * @var array<int|string, string>
     */
    'institucion_subsistema_clave' => [
        150005 => 'UPN',
        150474 => 'UPN',
        150475 => 'UPN',
        150162 => 'NORMAL',
        150340 => 'NORMAL',
        150012 => 'NORMAL',
    ],

    /**
     * Palabras clave en nombre_oferta_educativa → clave nivel SICES.
     *
     * @var array<string, string>
     */
    'nivel_clave_por_palabra' => [
        'licenciatura' => 'LIC',
        'licenciado' => 'LIC',
        'maestria' => 'MAE',
        'maestría' => 'MAE',
        'master' => 'MAE',
        'especializacion' => 'ESP',
        'especialización' => 'ESP',
        'doctorado' => 'DOC',
        'tecnico' => 'TEC',
        'técnico' => 'TEC',
    ],

    'entidades_resumen' => [
        'instituciones',
        'sedes',
        'niveles_academicos',
        'programas_estudio',
        'planes_estudio',
        'materias',
        'plan_materias',
        'ofertas_academicas',
    ],

];
