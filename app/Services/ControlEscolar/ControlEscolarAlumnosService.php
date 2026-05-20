<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\InscripcionPeriodo;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ControlEscolarAlumnosService
{
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
            $metricas = $this->dashboard->metricasGestionAlumnos($user);

            $query = $this->queryListado($user, $term !== '' ? $term : null);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $recientes = ($page === 1 && $term === '')
                ? collect($paginator->items())
                    ->take(3)
                    ->map(fn (Alumno $a) => $this->filaReciente($a))
                    ->values()
                    ->all()
                : $this->recientes($user, 3);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'recientes' => $recientes,
                'listado' => [
                    'data' => collect($paginator->items())->map(fn (Alumno $a) => $this->filaListado($a))->values()->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function recientes(User $user, int $limit): array
    {
        return $this->queryListado($user, null)
            ->limit($limit)
            ->get()
            ->map(fn (Alumno $a) => $this->filaReciente($a))
            ->values()
            ->all();
    }

    /**
     * @return Builder<Alumno>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = $this->alumnosBase($user)
            ->with([
                'matriculaActiva.ofertaAcademica.planEstudio.programaEstudio',
                'matriculaActiva.inscripcionesPeriodo' => fn ($q) => $q
                    ->whereIn('estatus', ['activa', 'inscrita'])
                    ->orderByDesc('id')
                    ->limit(1),
            ])
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('curp', 'like', $like)
                    ->orWhere('nombre', 'like', $like)
                    ->orWhere('primer_apellido', 'like', $like)
                    ->orWhere('segundo_apellido', 'like', $like)
                    ->orWhereHas('matriculas', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matriculaActiva.ofertaAcademica.planEstudio.programaEstudio', function (Builder $p) use ($like): void {
                        $p->where('nombre', 'like', $like)->orWhere('clave', 'like', $like);
                    });
            });
        }

        return $query;
    }

    /**
     * @return Builder<Alumno>
     */
    protected function alumnosBase(User $user): Builder
    {
        return $this->dashboard->queryAlumnosEnAlcance($user);
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(Alumno $alumno): array
    {
        $mat = $alumno->matriculaActiva;
        $prog = $mat?->ofertaAcademica?->planEstudio?->programaEstudio;

        return [
            'alumno_id' => $alumno->id,
            'matricula' => $mat?->matricula ?? '—',
            'nombre' => $this->nombreCompleto($alumno),
            'programa' => $prog?->nombre ?? '—',
            'periodo' => $this->periodoCurricular($mat?->inscripcionesPeriodo),
            'estatus' => $this->estatusLegible((string) ($alumno->estatus ?? '')),
            'expediente_url' => '/app/alumnos/'.$alumno->id.'/expediente',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaReciente(Alumno $alumno): array
    {
        $base = $this->filaListado($alumno);

        return [
            'alumno_id' => $base['alumno_id'],
            'matricula' => $base['matricula'],
            'nombre' => $base['nombre'],
            'programa' => $base['programa'],
            'estatus' => $base['estatus'],
        ];
    }

    protected function nombreCompleto(Alumno $alumno): string
    {
        return trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));
    }

    /**
     * @param  Collection<int, InscripcionPeriodo>|null  $inscripciones
     */
    protected function periodoCurricular(?Collection $inscripciones): string
    {
        $ins = $inscripciones?->first();
        if ($ins === null) {
            return '—';
        }

        if ($ins->etiqueta_periodo_curricular) {
            return (string) $ins->etiqueta_periodo_curricular;
        }

        if ($ins->numero_periodo_curricular !== null) {
            return (string) $ins->numero_periodo_curricular.'°';
        }

        return '—';
    }

    protected function estatusLegible(string $estatus): string
    {
        return match (strtolower($estatus)) {
            'activo', 'activa' => 'Activo',
            'baja_temporal' => 'Baja temporal',
            'baja_definitiva' => 'Baja definitiva',
            'egresado' => 'Egresado',
            'aspirante' => 'Aspirante',
            'inactivo' => 'Inactivo',
            default => $estatus !== '' ? ucfirst(str_replace('_', ' ', $estatus)) : 'Activo',
        };
    }
}
