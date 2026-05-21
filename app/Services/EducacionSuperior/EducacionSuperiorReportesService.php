<?php

declare(strict_types=1);

namespace App\Services\EducacionSuperior;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\Sede;
use App\Models\SolicitudMatricula;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\Dashboard\EducacionSuperiorMetricasService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Indicadores y catálogo de reportes oficiales para Educación Superior (datos agregados en BD).
 */
final class EducacionSuperiorReportesService
{
    private const RESPONSABLE_ACADEMICO = 'Dirección Académica';

    private const RESPONSABLE_NORMATIVO = 'Educación Superior';

    public function __construct(
        private readonly EducacionSuperiorMetricasService $metricasService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        if (! $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            throw new AuthorizationException('No autorizado para consultar reportes oficiales de Educación Superior.');
        }

        $metricas = $this->metricasService->build($user);
        $reportes = $this->catalogoReportes();
        $indicadores = $this->indicadores($reportes, $metricas);

        return [
            'actualizado_en' => now()->toIso8601String(),
            'metricas' => $this->metricasPresentacion($metricas),
            'reportes' => $reportes,
            'indicadores' => $indicadores,
        ];
    }

    /**
     * @param  array<string, int>  $metricas
     * @return array<string, mixed>
     */
    private function metricasPresentacion(array $metricas): array
    {
        $matricula = Alumno::query()->where('estatus', 'activo')->count();
        $egresados = (int) ($metricas['egresados_candidatos'] ?? 0);
        $certificados = (int) ($metricas['certificados_emitidos_referencia'] ?? $metricas['firmados'] ?? 0);
        $pendientes = (int) ($metricas['pendientes_revision'] ?? 0)
            + (int) ($metricas['solicitudes_matricula_pendientes'] ?? 0);
        $totalReportes = count($this->definicionCatalogo());

        return [
            'reportes_generados' => $certificados + (int) ($metricas['aprobados'] ?? 0),
            'matricula_oficial' => $matricula,
            'egresados' => $egresados,
            'certificados_emitidos' => $certificados,
            'pendientes' => $pendientes,
            'total_catalogo' => $totalReportes,
        ];
    }

    /**
     * @return list<array{clave: string, nombre: string, descripcion: string, ultima_generacion: ?string, responsable: string, ruta: string}>
     */
    private function catalogoReportes(): array
    {
        $tz = config('app.timezone');
        $fmt = static fn (?Carbon $dt): ?string => $dt
            ? $dt->timezone($tz)->format('d/m/Y')
            : null;

        $ultimaMatricula = Matricula::query()
            ->whereIn('estado', ['activa', 'vigente'])
            ->max('updated_at');
        $ultimaTrayectoria = TrayectoriaAcademica::query()->max('updated_at');
        $ultimaCertificacion = DocumentoAcademico::query()->max('updated_at');
        $ultimaNormativa = DocumentoAcademico::query()
            ->whereIn('estado_workflow', ['pendiente', 'en_revision', 'aprobado', 'rechazado'])
            ->max('updated_at');
        $ultimaSolicitud = SolicitudMatricula::query()->max('updated_at');
        $ultimaInstitucion = Institucion::query()->where('activo', true)->max('updated_at');
        $ultimaSede = Sede::query()->where('activo', true)->max('updated_at');
        $ultimaEgreso = TrayectoriaAcademica::query()
            ->whereIn('estado', ['consolidada', 'lista_certificacion'])
            ->max('updated_at');
        $ultimaEmitido = DocumentoAcademico::query()
            ->where('estado_firma', 'firmado')
            ->max('updated_at');

        $ultima919 = collect([$ultimaInstitucion, $ultimaSede])
            ->filter()
            ->map(fn ($v) => Carbon::parse((string) $v))
            ->sortDesc()
            ->first();

        $fechas = [
            '911' => $ultimaMatricula,
            '912' => $ultimaMatricula,
            '913' => $ultimaEgreso ?? $ultimaTrayectoria,
            '914' => $ultimaCertificacion,
            '915' => $ultimaCertificacion,
            '916' => $ultimaNormativa,
            '917' => $ultimaSolicitud,
            '918' => $ultimaEmitido ?? $ultimaCertificacion,
            '919' => $ultima919,
        ];

        return collect($this->definicionCatalogo())
            ->map(function (array $def) use ($fechas, $fmt): array {
                $clave = (string) $def['clave'];
                $raw = $fechas[$clave] ?? null;
                $dt = $raw ? Carbon::parse($raw) : null;

                return [
                    'clave' => $clave,
                    'nombre' => (string) $def['nombre'],
                    'descripcion' => (string) $def['descripcion'],
                    'ultima_generacion' => $fmt($dt),
                    'responsable' => (string) $def['responsable'],
                    'ruta' => (string) $def['ruta'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{clave: string, nombre: string, descripcion: string, responsable: string, ruta: string}>
     */
    private function definicionCatalogo(): array
    {
        return [
            [
                'clave' => '911',
                'nombre' => '911. Estadística de inicio de cursos',
                'descripcion' => 'Estadística oficial de inicio de cursos por ciclo escolar.',
                'responsable' => self::RESPONSABLE_ACADEMICO,
                'ruta' => '/app/educacion-superior/reportes-oficiales',
            ],
            [
                'clave' => '912',
                'nombre' => '912. Matrícula por programa educativo',
                'descripcion' => 'Matrícula activa desagregada por programa y oferta académica.',
                'responsable' => self::RESPONSABLE_ACADEMICO,
                'ruta' => '/app/educacion-superior/programas',
            ],
            [
                'clave' => '913',
                'nombre' => '913. Egresados por generación',
                'descripcion' => 'Candidatos a egreso y trayectorias consolidadas.',
                'responsable' => self::RESPONSABLE_ACADEMICO,
                'ruta' => '/app/documentos/bandejas/pendientes-revision',
            ],
            [
                'clave' => '914',
                'nombre' => '914. Titulación y certificación',
                'descripcion' => 'Seguimiento de titulación y certificación institucional.',
                'responsable' => self::RESPONSABLE_NORMATIVO,
                'ruta' => '/app/educacion-superior/certificacion',
            ],
            [
                'clave' => '915',
                'nombre' => '915. Indicadores académicos',
                'descripcion' => 'Indicadores académicos agregados del subsistema Normal / UPN.',
                'responsable' => self::RESPONSABLE_ACADEMICO,
                'ruta' => '/app/educacion-superior/reportes-oficiales',
            ],
            [
                'clave' => '916',
                'nombre' => '916. Validaciones normativas',
                'descripcion' => 'Expedientes en validación normativa y revisión documental.',
                'responsable' => self::RESPONSABLE_NORMATIVO,
                'ruta' => '/app/educacion-superior/validaciones-normativas',
            ],
            [
                'clave' => '917',
                'nombre' => '917. Solicitudes de matrícula',
                'descripcion' => 'Solicitudes de asignación de matrícula pendientes y atendidas.',
                'responsable' => self::RESPONSABLE_NORMATIVO,
                'ruta' => '/app/solicitudes-matricula',
            ],
            [
                'clave' => '918',
                'nombre' => '918. Documentos emitidos',
                'descripcion' => 'Documentos académicos firmados y emitidos oficialmente.',
                'responsable' => self::RESPONSABLE_NORMATIVO,
                'ruta' => '/app/documentos/bandejas/aprobados',
            ],
            [
                'clave' => '919',
                'nombre' => '919. Instituciones y sedes activas',
                'descripcion' => 'Catálogo de instituciones y sedes/subsedes vigentes.',
                'responsable' => self::RESPONSABLE_ACADEMICO,
                'ruta' => '/app/educacion-superior/instituciones',
            ],
        ];
    }

    /**
     * @param  list<array{ultima_generacion: ?string}>  $reportes
     * @param  array<string, int>  $metricas
     * @return list<array{title: string, value: int, total: int, color: string}>
     */
    private function indicadores(array $reportes, array $metricas): array
    {
        $total = max(1, count($reportes));
        $conFecha = collect($reportes)->filter(fn (array $r) => ! empty($r['ultima_generacion']))->count();
        $recientes = collect($reportes)->filter(function (array $r): bool {
            if (empty($r['ultima_generacion'])) {
                return false;
            }
            try {
                $dt = Carbon::createFromFormat('d/m/Y', (string) $r['ultima_generacion']);

                return $dt->greaterThanOrEqualTo(now()->subDays(90));
            } catch (\Throwable) {
                return false;
            }
        })->count();

        $observaciones = (int) ($metricas['rechazados'] ?? 0);
        $validados = (int) ($metricas['firmados'] ?? 0);

        return [
            [
                'title' => 'Cumplimiento de reportes',
                'value' => $conFecha,
                'total' => $total,
                'color' => '#185FA5',
            ],
            [
                'title' => 'Reportes en tiempo',
                'value' => $recientes,
                'total' => $total,
                'color' => '#534AB7',
            ],
            [
                'title' => 'Observaciones normativas',
                'value' => min($observaciones, 50),
                'total' => 50,
                'color' => '#BA7517',
            ],
            [
                'title' => 'Documentos validados',
                'value' => $validados,
                'total' => max($validados, (int) ($metricas['aprobados'] ?? 0) + $validados, 1),
                'color' => '#0F6E56',
            ],
        ];
    }
}
