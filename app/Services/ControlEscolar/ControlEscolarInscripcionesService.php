<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\InscripcionPeriodo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarInscripcionesService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function gestion(User $user, ?string $search, int $page, int $perPage): array
    {
        $perPage = max(1, min(50, $perPage));
        $page = max(1, $page);
        $term = trim((string) $search);

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $term, $page, $perPage): array {
            $metricas = $this->metricas($user);
            $query = $this->queryListado($user, $term !== '' ? $term : null);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'regla_matricula' => 'La inscripción de periodo requiere matrícula activa del alumno en tu alcance territorial.',
                'listado' => [
                    'data' => collect($paginator->items())
                        ->map(fn (InscripcionPeriodo $ins) => $this->filaListado($ins))
                        ->values()
                        ->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
                'fechas_importantes' => $this->fechasImportantes(),
            ];
        });
    }

    /**
     * @return array{nuevas: int, por_validar: int, confirmadas: int, observadas: int, total_alcance: int}
     */
    protected function metricas(User $user): array
    {
        $base = $this->queryListado($user, null);
        $total = (clone $base)->count();

        $confirmadas = (clone $base)
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereHas('cargasAcademicas')
            ->count();

        $observadas = (clone $base)
            ->whereHas('matricula.alumno.documentosAcademicos', function (Builder $q): void {
                $q->where('estado_workflow', 'rechazado')
                    ->orWhereHas('observacionesPendientes');
            })
            ->count();

        $porValidar = max(0, $total - $confirmadas - $observadas);

        return [
            'nuevas' => $total,
            'por_validar' => $porValidar,
            'confirmadas' => $confirmadas,
            'observadas' => $observadas,
            'total_alcance' => $total,
        ];
    }

    /**
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = InscripcionPeriodo::query()
            ->with([
                'matricula.alumno:id,nombre,primer_apellido,segundo_apellido,curp',
                'matricula:id,matricula,alumno_id,oferta_academica_id',
                'matricula.ofertaAcademica.planEstudio.programaEstudio',
                'cicloEscolar:id,nombre,clave',
                'cargasAcademicas:id,inscripcion_periodo_id',
                'matricula.alumno.documentosAcademicos' => fn ($q) => $q->latest('id')->limit(3)->with('observacionesPendientes'),
            ])
            ->whereHas('matricula', function (Builder $mat) use ($user): void {
                $mat->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereHas('alumno', function (Builder $alumno) use ($user): void {
                        $alumno->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
                    });
            })
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $folioId = $this->resolverInscripcionIdDesdeFolio($term);
            $query->where(function (Builder $q) use ($like, $folioId): void {
                $q->whereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matricula.alumno', function (Builder $a) use ($like): void {
                        $a->where('curp', 'like', $like)
                            ->orWhere('nombre', 'like', $like)
                            ->orWhere('primer_apellido', 'like', $like)
                            ->orWhere('segundo_apellido', 'like', $like);
                    })
                    ->orWhereHas('matricula.ofertaAcademica.planEstudio.programaEstudio', function (Builder $p) use ($like): void {
                        $p->where('nombre', 'like', $like)->orWhere('clave', 'like', $like);
                    });
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
            });
        }

        return $query;
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(InscripcionPeriodo $ins): array
    {
        $alumno = $ins->matricula?->alumno;
        $prog = $ins->matricula?->ofertaAcademica?->planEstudio?->programaEstudio;
        $fecha = $ins->fecha_inscripcion ?? $ins->updated_at;

        return [
            'inscripcion_id' => $ins->id,
            'alumno_id' => $alumno?->id,
            'folio' => $this->folioInscripcion($ins->id),
            'alumno' => $this->nombreCompleto($alumno),
            'id' => $ins->matricula?->matricula ?? $this->curpAbreviada($alumno),
            'programa' => $prog?->nombre ?? '—',
            'fecha' => $fecha?->toIso8601String() ?? '',
            'estatus' => $this->estatusVisual($ins),
            'expediente_url' => $alumno ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/expedientes',
        ];
    }

    protected function estatusVisual(InscripcionPeriodo $ins): string
    {
        if ($this->tieneObservaciones($ins)) {
            return 'Observada';
        }

        if ($ins->cargasAcademicas->isNotEmpty()
            && in_array((string) $ins->estatus, self::ESTATUS_INSCRIPCION_ACTIVA, true)) {
            return 'Confirmada';
        }

        return 'Por validar';
    }

    protected function tieneObservaciones(InscripcionPeriodo $ins): bool
    {
        $alumno = $ins->matricula?->alumno;
        if ($alumno === null) {
            return false;
        }

        return $alumno->documentosAcademicos->contains(function (DocumentoAcademico $doc): bool {
            if ($doc->estado_workflow === 'rechazado') {
                return true;
            }

            return $doc->observacionesPendientes->isNotEmpty();
        });
    }

    /**
     * @return list<array{fecha: string, mes: string, titulo: string, sub: string, badge: string}>
     */
    protected function fechasImportantes(): array
    {
        $ciclo = CicloEscolar::query()
            ->where('clave', 'SXCE-DEMO-CICLO-2026')
            ->first();

        if ($ciclo === null) {
            $ciclo = CicloEscolar::query()->where('activo', true)->orderByDesc('id')->first();
        }

        if ($ciclo === null) {
            return [];
        }

        $items = [];
        $fin = $ciclo->fecha_fin;
        $inicio = $ciclo->fecha_inicio;

        if ($fin instanceof Carbon) {
            $cierre = $fin->copy()->subDays(8);
            $items[] = $this->fechaItem($cierre, 'Cierre de validación documental', 'Antes del fin de ciclo', 'Próximo');
            $items[] = $this->fechaItem($fin->copy()->subDays(4), 'Límite para confirmar inscripciones', $fin->format('d/m/Y'), 'Próximo');
        }

        if ($inicio instanceof Carbon) {
            $items[] = $this->fechaItem($inicio, 'Inicio de clases', $inicio->format('d/m/Y'), 'Programado');
        }

        return array_slice($items, 0, 3);
    }

    /**
     * @return array{fecha: string, mes: string, titulo: string, sub: string, badge: string}
     */
    protected function fechaItem(Carbon $fecha, string $titulo, string $sub, string $badge): array
    {
        return [
            'fecha' => $fecha->format('d'),
            'mes' => strtoupper($fecha->locale('es')->translatedFormat('M')),
            'titulo' => $titulo,
            'sub' => $sub,
            'badge' => $badge,
        ];
    }

    protected function folioInscripcion(int $id): string
    {
        return 'INS-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT);
    }

    protected function resolverInscripcionIdDesdeFolio(string $term): ?int
    {
        if (preg_match('/^INS-0*(\d+)$/i', trim($term), $m) === 1) {
            return (int) $m[1];
        }

        return null;
    }

    protected function nombreCompleto(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        return trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));
    }

    protected function curpAbreviada(?Alumno $alumno): string
    {
        $curp = (string) ($alumno?->curp ?? '');
        if (strlen($curp) < 8) {
            return $curp !== '' ? $curp : '—';
        }

        return 'CURP …'.substr($curp, -4);
    }
}
