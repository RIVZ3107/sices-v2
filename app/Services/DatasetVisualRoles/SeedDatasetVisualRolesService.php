<?php

declare(strict_types=1);

namespace App\Services\DatasetVisualRoles;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CargaAcademica;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Institucion;
use App\Models\IntegracionLog;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\PeriodoEscolar;
use App\Models\PlanMateria;
use App\Models\PlanEstudio;
use App\Models\Sede;
use App\Models\SolicitudMatricula;
use App\Models\Subsistema;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Models\VisualDatasetEvent;
use App\Support\DatasetVisualRolesMetadata;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class SeedDatasetVisualRolesService
{
    private const PASSWORD_ENV = 'SICES_DATASET_VISUAL_PASSWORD';

    /** @var array<string, array{email: string, name: string}> */
    private const USUARIOS = [
        'superadmin' => ['email' => 'superadmin.dataset@sices.local', 'name' => 'Superadmina (dataset visual)'],
        'sistemas' => ['email' => 'sistemas@sices.local', 'name' => 'Mariana Rivas — Sistemas'],
        'educacion_superior' => ['email' => 'superior@sices.local', 'name' => 'Laura Hernández — Educación Superior'],
        'director_escuela' => ['email' => 'direccion@sices.local', 'name' => 'Jorge Castañeda — Dirección escolar'],
        'control_escolar_escuela' => ['email' => 'control.escolar@sices.local', 'name' => 'Patricia Gómez — Control escolar'],
        'responsable_admision' => ['email' => 'admision@sices.local', 'name' => 'Ricardo Soto — Admisión'],
        'responsable_evaluacion' => ['email' => 'evaluacion@sices.local', 'name' => 'Mónica Delgado — Evaluación'],
        'responsable_certificacion_titulacion' => ['email' => 'certificacion@sices.local', 'name' => 'Elena Vargas — Certificación'],
        'docente' => ['email' => 'docente@sices.local', 'name' => 'Alberto Núñez — Docente'],
        'auditor' => ['email' => 'auditor@sices.local', 'name' => 'Claudia Reyes — Auditoría'],
        'alumno_egresado' => ['email' => 'alumno@sices.local', 'name' => 'Portal alumno (dataset)'],
        'aspirante_preinscrito' => ['email' => 'aspirante@sices.local', 'name' => 'Portal aspirante (dataset)'],
    ];

    public function __construct(
        private readonly VisualDatasetCatalogResolver $catalog,
        private readonly ResetDatasetVisualRolesService $reset,
    ) {}

    public function seed(bool $forceProduction, bool $replaceExistingDataset): void
    {
        if (app()->environment('production') && ! $forceProduction) {
            throw new \RuntimeException('Dataset visual bloqueado en production. Use --force explícito.');
        }

        if ($replaceExistingDataset) {
            $this->reset->ejecutar();
        } elseif (Alumno::query()->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)->exists()) {
            throw new \RuntimeException('Ya existe el dataset visual. Ejecute `php artisan sices:reset-dataset-visual-roles` o pase --force al comando de seed.');
        }

        $pwd = (string) (env(self::PASSWORD_ENV) ?: 'SicesDataset2026!');

        DB::transaction(function () use ($pwd): void {
            $meta = DatasetVisualRolesMetadata::mark();

            $normal = Subsistema::query()->where('clave', 'NORMAL')->firstOrFail();
            $upn = Subsistema::query()->where('clave', 'UPN')->firstOrFail();

            $sedes = $this->catalog->sedesDesdeCatalogo();
            if ($sedes->count() < 6) {
                throw new \RuntimeException('Se requieren al menos 6 sedes del catálogo; encontradas: '.$sedes->count().'. Verifique seeders institucionales.');
            }

            $programasPorSub = $this->catalog->programasPorClaveSubsistema($normal, $upn);

            $ciclo = CicloEscolar::query()->updateOrCreate(
                ['clave' => 'SICES-VISUAL-2024-2025'],
                [
                    'nombre' => 'Ciclo escolar 2024-2025 (dataset visual roles)',
                    'fecha_inicio' => '2024-08-01',
                    'fecha_fin' => '2025-07-31',
                    'es_actual' => false,
                    'activo' => true,
                    'metadata' => $meta,
                ],
            );

            $periodo = PeriodoEscolar::query()->updateOrCreate(
                ['clave' => 'SICES-VISUAL-PER-2425-1'],
                [
                    'ciclo_escolar_id' => $ciclo->id,
                    'nombre' => 'Periodo ordinario 2024-2025 (visual)',
                    'fecha_inicio' => '2024-08-15',
                    'fecha_fin' => '2024-12-20',
                    'estatus' => 'activo',
                    'metadata' => $meta,
                ],
            );

            /** @var array<int, OfertaAcademica> $ofertasPorSede */
            $ofertasPorSede = [];
            foreach ($sedes as $sede) {
                $inst = Institucion::query()->with('subsistema')->find((int) $sede->institucion_id);
                if ($inst === null || $inst->subsistema === null) {
                    continue;
                }
                $clave = strtoupper((string) $inst->subsistema->clave);
                $programa = $programasPorSub[$clave] ?? null;
                if ($programa === null) {
                    continue;
                }
                /** @var PlanEstudio|null $plan */
                $plan = $programa->planesEstudio()->orderBy('id')->first();
                if ($plan === null) {
                    continue;
                }
                $claveOferta = 'SICES-VIS-OFF-'.$sede->id.'-'.$ciclo->id;
                $ofertaMeta = array_merge($meta, ['sede_catalogo' => $sede->nombre]);
                $ofertasPorSede[$sede->id] = OfertaAcademica::query()->updateOrCreate(
                    ['clave' => $claveOferta],
                    [
                        'institucion_id' => $inst->id,
                        'sede_id' => $sede->id,
                        'programa_estudio_id' => $programa->id,
                        'plan_estudio_id' => $plan->id,
                        'ciclo_escolar_id' => $ciclo->id,
                        'modalidad' => 'escolarizada',
                        'capacidad' => 500,
                        'activo' => true,
                        'metadata' => $ofertaMeta,
                    ],
                );
            }

            if ($ofertasPorSede === []) {
                throw new \RuntimeException('No se pudo generar ninguna oferta académica para el dataset visual.');
            }

            $users = $this->upsertUsuarios($pwd);
            $this->sincronizarAlcanceInstitucional($users, $sedes);

            $this->sembrarEventosTecnicos($meta);
            $this->sembrarIntegracionesYAuditoria($meta, $users);

            $planMateriaCache = [];
            foreach ($ofertasPorSede as $of) {
                $pid = (int) $of->plan_estudio_id;
                if (! isset($planMateriaCache[$pid])) {
                    $planMateriaCache[$pid] = PlanMateria::query()->where('plan_estudio_id', $pid)->orderBy('id')->first();
                }
            }

            $ofertasLista = collect($ofertasPorSede)->values();
            $nOfertas = $ofertasLista->count();

            for ($i = 1; $i <= 88; $i++) {
                /** @var Sede $sede */
                $sede = $sedes[($i - 1) % $sedes->count()];
                $oferta = $ofertasPorSede[$sede->id] ?? $ofertasLista[$i % $nOfertas];
                $inst = Institucion::query()->findOrFail((int) $oferta->institucion_id);
                $plan = PlanEstudio::query()->findOrFail((int) $oferta->plan_estudio_id);
                $pm = $planMateriaCache[(int) $plan->id] ?? PlanMateria::query()->where('plan_estudio_id', $plan->id)->orderBy('id')->first();
                if ($pm !== null) {
                    $planMateriaCache[(int) $plan->id] = $pm;
                }

                $curp = 'VIS'.str_pad((string) $i, 15, '0', STR_PAD_LEFT);
                $nombre = $this->nombreFicticio($i);
                $alumnoMeta = array_merge($meta, ['indice_dataset' => $i]);
                if ($i === 87) {
                    $alumnoMeta['usuario_visual_email'] = 'alumno@sices.local';
                }
                if ($i === 88) {
                    $alumnoMeta['usuario_visual_email'] = 'aspirante@sices.local';
                }

                $alumno = Alumno::query()->create([
                    'curp' => $curp,
                    'nombre' => $nombre['nombre'],
                    'primer_apellido' => $nombre['paterno'],
                    'segundo_apellido' => $nombre['materno'],
                    'fecha_nacimiento' => '2002-03-15',
                    'genero' => 'M',
                    'nacionalidad' => 'MX',
                    'estatus' => $i === 88 ? 'aspirante' : 'activo',
                    'metadata' => $alumnoMeta,
                ]);

                if ($i === 88) {
                    continue;
                }

                if ($i <= 22) {
                    $estadoSol = match ($i % 4) {
                        0 => SolicitudMatricula::ESTADO_ENVIADA,
                        1 => SolicitudMatricula::ESTADO_EN_REVISION,
                        2 => SolicitudMatricula::ESTADO_CON_OBSERVACIONES,
                        default => SolicitudMatricula::ESTADO_BORRADOR,
                    };
                    SolicitudMatricula::query()->create([
                        'alumno_id' => $alumno->id,
                        'subsistema_id' => (int) $inst->subsistema_id,
                        'institucion_id' => $inst->id,
                        'sede_id' => $sede->id,
                        'oferta_academica_id' => $oferta->id,
                        'programa_estudio_id' => $oferta->programa_estudio_id,
                        'plan_estudio_id' => $oferta->plan_estudio_id,
                        'ciclo_ingreso_id' => $ciclo->id,
                        'estado' => $estadoSol,
                        'solicitada_por' => $users['control_escolar_escuela']->id,
                        'metadata' => array_merge($meta, ['tabla_demo' => 'solicitudes_superior']),
                    ]);

                    continue;
                }

                $mod = $i % 12;

                $matricula = Matricula::query()->create([
                    'alumno_id' => $alumno->id,
                    'oferta_academica_id' => $oferta->id,
                    'ciclo_escolar_id' => $ciclo->id,
                    'subsistema_id' => (int) $inst->subsistema_id,
                    'matricula' => 'MET-VIS-'.str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                    'estado' => 'activa',
                    'fecha_ingreso' => '2024-08-20',
                    'metadata' => $meta,
                ]);

                if ($mod === 3) {
                    continue;
                }

                $inscripcion = InscripcionPeriodo::query()->create([
                    'matricula_id' => $matricula->id,
                    'ciclo_escolar_id' => $ciclo->id,
                    'periodo_escolar_id' => $periodo->id,
                    'grupo_id' => null,
                    'semestre' => 1,
                    'tipo_periodo_curricular' => 'semestral',
                    'numero_periodo_curricular' => 1,
                    'etiqueta_periodo_curricular' => '2024-2025 · P1',
                    'estatus' => 'activa',
                    'fecha_inscripcion' => '2024-08-21',
                    'metadata' => $meta,
                ]);

                if ($mod === 4 || $pm === null) {
                    continue;
                }

                $carga = CargaAcademica::query()->create([
                    'inscripcion_periodo_id' => $inscripcion->id,
                    'plan_materia_id' => $pm->id,
                    'materia_id' => $pm->materia_id,
                    'estatus' => 'activa',
                    'metadata' => $meta,
                ]);

                if ($mod !== 5) {
                    MateriaCursada::query()->create([
                        'alumno_id' => $alumno->id,
                        'matricula_id' => $matricula->id,
                        'inscripcion_periodo_id' => $inscripcion->id,
                        'carga_academica_id' => $carga->id,
                        'materia_id' => $pm->materia_id,
                        'plan_materia_id' => $pm->id,
                        'ciclo_escolar_id' => $ciclo->id,
                        'clave' => (string) $pm->clave_materia,
                        'nombre' => (string) $pm->nombre_materia,
                        'calificacion' => 8.5,
                        'calificacion_final' => 8.5,
                        'periodo' => 1,
                        'semestre' => 1,
                        'tipo_periodo_curricular' => 'semestral',
                        'numero_periodo_curricular' => 1,
                        'etiqueta_periodo_curricular' => 'P1',
                        'orden' => 1,
                        'creditos' => (int) $pm->creditos,
                        'tipo' => 'ordinaria',
                        'tipo_evaluacion' => 'numerica',
                        'estado' => 'cursada',
                        'estatus_acreditacion' => 'acreditada',
                        'metadata' => $meta,
                    ]);
                }

                if ($mod === 7) {
                    TrayectoriaAcademica::query()->create([
                        'alumno_id' => $alumno->id,
                        'matricula_id' => $matricula->id,
                        'fecha_inicio' => '2024-08-01',
                        'fecha_fin' => null,
                        'promedio' => 8.7,
                        'creditos_obtenidos' => 220,
                        'creditos_totales' => 240,
                        'total_materias' => 40,
                        'materias_aprobadas' => 38,
                        'materias_reprobadas' => 0,
                        'estatus_trayectoria' => 'activa',
                        'estado' => 'consolidada',
                        'metadata' => $meta,
                    ]);
                }

                if ($mod >= 8) {
                    $wf = match ($mod) {
                        8 => 'borrador',
                        9 => 'pendiente',
                        10 => 'en_revision',
                        default => 'aprobado',
                    };
                    DocumentoAcademico::query()->create([
                        'alumno_id' => $alumno->id,
                        'matricula_id' => $matricula->id,
                        'oferta_academica_id' => $oferta->id,
                        'ciclo_escolar_id' => $ciclo->id,
                        'subsistema_id' => (int) $inst->subsistema_id,
                        'institucion_id' => $inst->id,
                        'sede_id' => $sede->id,
                        'tipo_documento' => 'certificado',
                        'tipo_certificacion' => 'termino',
                        'folio_interno' => 'VIS-INT-'.$i,
                        'folio_digital_sep' => 'VISFD'.str_pad((string) $i, 11, '0', STR_PAD_LEFT),
                        'token_consulta_publica' => 'VISTOK'.str_pad((string) $i, 12, '0', STR_PAD_LEFT),
                        'estado_workflow' => $wf,
                        'estado_cadena' => 'no_generada',
                        'estado_xml' => 'no_generado',
                        'estado_firma' => 'no_firmado',
                        'estado_pdf' => 'no_generado',
                        'fecha_solicitud' => now()->subDays(5),
                        'metadata' => $meta,
                        'created_by' => $users['control_escolar_escuela']->id,
                    ]);
                }

                if ($mod === 6) {
                    ImportacionHistoricaMaterias::query()->create([
                        'user_id' => $users['control_escolar_escuela']->id,
                        'matricula_id' => $matricula->id,
                        'ciclo_escolar_id' => $ciclo->id,
                        'estado' => 'error',
                        'filas_payload' => ['simulado' => true],
                        'validacion_payload' => ['tiene_bloqueos' => true, 'mensaje' => 'Simulación dataset visual'],
                        'metadata' => $meta,
                    ]);
                }
            }
        });
    }

    /**
     * @return array<string, User>
     */
    private function upsertUsuarios(string $password): array
    {
        $hash = Hash::make($password);
        $out = [];
        foreach (self::USUARIOS as $rol => $def) {
            $u = User::query()->updateOrCreate(
                ['email' => $def['email']],
                ['name' => $def['name'], 'password' => $hash],
            );
            $u->syncRoles([$rol]);
            $out[$rol] = $u->fresh();
        }

        return $out;
    }

    /**
     * @param  array<string, User>  $users
     * @param  \Illuminate\Support\Collection<int, Sede>  $sedes
     */
    private function sincronizarAlcanceInstitucional(array $users, $sedes): void
    {
        $instIds = $sedes->pluck('institucion_id')->unique()->filter()->values()->all();
        $sedeIds = $sedes->pluck('id')->unique()->values()->all();
        $regionIds = Institucion::query()->whereIn('id', $instIds)->whereNotNull('region_id')->pluck('region_id')->unique()->filter()->values()->all();

        $rolesOperativosEscuela = [
            'control_escolar_escuela',
            'director_escuela',
            'responsable_admision',
            'docente',
        ];
        foreach ($rolesOperativosEscuela as $r) {
            if (! isset($users[$r])) {
                continue;
            }
            $users[$r]->instituciones()->syncWithoutDetaching($instIds);
            $users[$r]->sedes()->syncWithoutDetaching($sedeIds);
            if ($regionIds !== []) {
                $users[$r]->regiones()->syncWithoutDetaching($regionIds);
            }
        }

        foreach (['educacion_superior', 'auditor', 'responsable_certificacion_titulacion', 'responsable_evaluacion'] as $r) {
            if (! isset($users[$r])) {
                continue;
            }
            $users[$r]->instituciones()->syncWithoutDetaching($instIds);
            $users[$r]->sedes()->syncWithoutDetaching($sedeIds);
            if ($regionIds !== []) {
                $users[$r]->regiones()->syncWithoutDetaching($regionIds);
            }
        }

        /** Sistemas y superadmin: alcance amplio de lectura */
        foreach (['sistemas', 'superadmin'] as $r) {
            if (! isset($users[$r])) {
                continue;
            }
            $users[$r]->instituciones()->syncWithoutDetaching($instIds);
            $users[$r]->sedes()->syncWithoutDetaching($sedeIds);
            if ($regionIds !== []) {
                $users[$r]->regiones()->syncWithoutDetaching($regionIds);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function sembrarEventosTecnicos(array $meta): void
    {
        $filas = [
            ['jobs', 'en_cola', 'Procesamiento XML en cola (simulado)', 'Documento certificación UPN 151'],
            ['jobs', 'completado', 'Render PDF completado', 'Certificado parcial — Normal Valle de Toluca'],
            ['jobs', 'error', 'Reintento agotado (simulación)', 'Cadena original — revisión manual'],
            ['logs', 'operativo', 'Consulta endpoint interno /health', 'SICES API — sin errores'],
            ['logs', 'advertencia', 'Latencia elevada hacia almacenamiento', 'Storage público branding'],
            ['integraciones', 'operativo', 'Webhook de notificación', 'Entrega simulada a cola interna'],
            ['incidencias', 'error', 'Timeout en paso técnico (no productivo)', 'Solo dataset visual'],
            ['respaldos', 'completado', 'Respaldo incremental nocturno', 'Base académica — simulación'],
            ['xml_proceso', 'en_cola', 'Validación de esquema pendiente', 'Normal — licenciatura primaria'],
            ['firma_proceso', 'advertencia', 'Esperando ventana de sellado', 'UPN Ecatepec'],
            ['pdf_proceso', 'completado', 'PDF de consulta pública generado', 'Token de verificación simulado'],
            ['menus', 'operativo', 'Menús sincronizados por rol', 'Sistemas'],
            ['apariencia', 'operativo', 'Tema institucional publicado', 'Colores SICES v2'],
        ];
        foreach (range(1, 48) as $k) {
            $tpl = $filas[($k - 1) % count($filas)];
            VisualDatasetEvent::query()->create([
                'bucket' => $tpl[0],
                'estado' => $tpl[1],
                'summary' => $tpl[2].' #'.$k,
                'detail' => $tpl[3],
                'metadata' => array_merge($meta, ['seq' => $k]),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $meta
     * @param  array<string, User>  $users
     */
    private function sembrarIntegracionesYAuditoria(array $meta, array $users): void
    {
        foreach (range(1, 22) as $k) {
            IntegracionLog::query()->create([
                'documento_academico_id' => null,
                'tipo' => $k % 2 === 0 ? 'XML_GENERATION' : 'PDF_GENERATION',
                'endpoint' => '/internal/simulation',
                'method' => 'POST',
                'correlation_id' => (string) Str::uuid(),
                'idempotency_key' => 'vis-'.$k,
                'request_payload' => ['simulado' => true, 'k' => $k],
                'response_payload' => ['ok' => $k % 4 !== 0],
                'http_status' => $k % 4 === 0 ? 500 : 200,
                'estado' => $k % 4 === 0 ? 'FAILED' : 'SUCCESS',
                'error_message' => $k % 4 === 0 ? 'Error simulado (dataset visual)' : null,
                'duration_ms' => 120 + $k,
                'metadata' => array_merge($meta, ['seq' => $k]),
            ]);
        }

        $uid = $users['sistemas']->id ?? $users['superadmin']->id;
        foreach (range(1, 18) as $k) {
            AuditoriaEvento::query()->create([
                'user_id' => $uid,
                'evento' => 'dataset_visual.consulta_'.$k,
                'entidad_tipo' => 'simulacion',
                'entidad_id' => $k,
                'payload' => ['accion' => 'lectura', 'modulo' => 'dashboard'],
                'ip' => '127.0.0.1',
                'user_agent' => 'SICES-DatasetVisual/1.0',
                'metadata' => array_merge($meta, ['seq' => $k]),
            ]);
        }
    }

    /**
     * @return array{nombre: string, paterno: string, materno: string}
     */
    private function nombreFicticio(int $i): array
    {
        $n = ['Andrea', 'Bruno', 'Camila', 'Daniel', 'Elisa', 'Fernando', 'Gabriela', 'Héctor', 'Ivonne', 'Javier'];
        $a = ['Aguilar', 'Blanco', 'Campos', 'Domínguez', 'Espinoza', 'Flores', 'Galván', 'Herrera', 'Ibarra', 'Juárez'];
        $b = ['Nájera', 'Ortega', 'Pineda', 'Quiroz', 'Ramírez', 'Sánchez', 'Torres', 'Uribe', 'Vega', 'Zúñiga'];

        return [
            'nombre' => $n[$i % count($n)],
            'paterno' => $a[($i * 3) % count($a)],
            'materno' => $b[($i * 5) % count($b)],
        ];
    }
}
