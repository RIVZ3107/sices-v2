<?php

declare(strict_types=1);

namespace App\Services\Catalogos;

use App\Enums\Academico\TipoPeriodoEscolar;
use App\Models\CicloEscolar;
use App\Models\PeriodoEscolar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CicloEscolarCatalogoService
{
    /**
     * @return array<string, mixed>
     */
    public function resumenCiclos(): array
    {
        $total = CicloEscolar::query()->count();
        $activos = CicloEscolar::query()->where('activo', true)->count();
        $actual = CicloEscolar::query()->where('es_actual', true)->first();

        $hoy = now()->startOfDay();
        $periodosActivos = PeriodoEscolar::query()->where('activo', true)->count();
        $periodosProximos = PeriodoEscolar::query()
            ->where('activo', true)
            ->whereDate('fecha_inicio', '>', $hoy)
            ->count();

        return [
            'ciclos_escolares' => [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => max(0, $total - $activos),
            ],
            'ciclo_actual' => $actual ? $this->presentarCiclo($actual) : null,
            'periodos_escolares' => [
                'total' => PeriodoEscolar::query()->count(),
                'activos' => $periodosActivos,
                'proximos' => $periodosProximos,
            ],
            'sin_ciclo_actual' => $actual === null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentarCiclo(CicloEscolar $ciclo, bool $tecnico = false): array
    {
        $data = [
            'id' => $ciclo->id,
            'clave' => $ciclo->clave,
            'nombre' => $ciclo->nombre,
            'fecha_inicio' => $ciclo->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $ciclo->fecha_fin?->format('Y-m-d'),
            'es_actual' => (bool) $ciclo->es_actual,
            'activo' => (bool) $ciclo->activo,
            'estatus' => $ciclo->activo ? 'activo' : 'inactivo',
            'periodos_count' => $ciclo->periodos_escolares_count ?? $ciclo->periodosEscolares()->count(),
        ];

        if ($tecnico && is_array($ciclo->metadata)) {
            $data['informacion_tecnica'] = $ciclo->metadata;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function presentarPeriodo(PeriodoEscolar $periodo, bool $tecnico = false): array
    {
        $data = [
            'id' => $periodo->id,
            'ciclo_escolar_id' => $periodo->ciclo_escolar_id,
            'clave' => $periodo->clave,
            'nombre' => $periodo->nombre,
            'tipo_periodo' => $periodo->tipo_periodo,
            'tipo_periodo_label' => TipoPeriodoEscolar::tryFrom((string) $periodo->tipo_periodo)?->label() ?? $periodo->tipo_periodo,
            'numero_periodo' => (int) $periodo->numero_periodo,
            'fecha_inicio' => $periodo->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $periodo->fecha_fin?->format('Y-m-d'),
            'fecha_inicio_inscripcion' => $periodo->fecha_inicio_inscripcion?->format('Y-m-d'),
            'fecha_fin_inscripcion' => $periodo->fecha_fin_inscripcion?->format('Y-m-d'),
            'fecha_inicio_calificaciones' => $periodo->fecha_inicio_calificaciones?->format('Y-m-d'),
            'fecha_fin_calificaciones' => $periodo->fecha_fin_calificaciones?->format('Y-m-d'),
            'activo' => (bool) $periodo->activo,
            'estatus' => $periodo->activo ? 'activo' : 'inactivo',
        ];

        if ($tecnico && is_array($periodo->metadata)) {
            $data['informacion_tecnica'] = $periodo->metadata;
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crearCiclo(array $data): CicloEscolar
    {
        if ((bool) ($data['es_actual'] ?? false) && ! (bool) ($data['activo'] ?? true)) {
            throw ValidationException::withMessages([
                'es_actual' => ['No se puede marcar como actual un ciclo inactivo.'],
            ]);
        }

        return DB::transaction(function () use ($data): CicloEscolar {
            $ciclo = CicloEscolar::query()->create([
                'clave' => $data['clave'],
                'nombre' => $data['nombre'],
                'fecha_inicio' => $data['fecha_inicio'],
                'fecha_fin' => $data['fecha_fin'],
                'es_actual' => (bool) ($data['es_actual'] ?? false),
                'activo' => (bool) ($data['activo'] ?? true),
                'metadata' => $data['metadata'] ?? null,
            ]);

            if ($ciclo->es_actual) {
                $this->marcarComoActualInterno($ciclo);
            }

            return $ciclo->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizarCiclo(CicloEscolar $ciclo, array $data): CicloEscolar
    {
        return DB::transaction(function () use ($ciclo, $data): CicloEscolar {
            $ciclo->fill([
                'clave' => $data['clave'] ?? $ciclo->clave,
                'nombre' => $data['nombre'] ?? $ciclo->nombre,
                'fecha_inicio' => $data['fecha_inicio'] ?? $ciclo->fecha_inicio,
                'fecha_fin' => $data['fecha_fin'] ?? $ciclo->fecha_fin,
                'activo' => array_key_exists('activo', $data) ? (bool) $data['activo'] : $ciclo->activo,
                'metadata' => array_key_exists('metadata', $data) ? $data['metadata'] : $ciclo->metadata,
            ]);

            if (array_key_exists('es_actual', $data)) {
                $ciclo->es_actual = (bool) $data['es_actual'];
            }

            if ($ciclo->es_actual && ! $ciclo->activo) {
                throw ValidationException::withMessages([
                    'es_actual' => ['No se puede marcar como actual un ciclo inactivo.'],
                ]);
            }

            $ciclo->save();

            if ($ciclo->es_actual) {
                $this->marcarComoActualInterno($ciclo);
            }

            return $ciclo->fresh();
        });
    }

    public function marcarComoActual(CicloEscolar $ciclo): CicloEscolar
    {
        if (! $ciclo->activo) {
            throw ValidationException::withMessages([
                'activo' => ['No se puede marcar como actual un ciclo inactivo.'],
            ]);
        }

        return DB::transaction(function () use ($ciclo): CicloEscolar {
            $this->marcarComoActualInterno($ciclo);

            return $ciclo->fresh();
        });
    }

    public function activarCiclo(CicloEscolar $ciclo, bool $activo): CicloEscolar
    {
        if (! $activo && $ciclo->es_actual) {
            throw ValidationException::withMessages([
                'activo' => ['No se puede desactivar el ciclo marcado como actual. Marque otro ciclo como actual primero.'],
            ]);
        }

        $ciclo->activo = $activo;
        if (! $activo) {
            $ciclo->es_actual = false;
        }
        $ciclo->save();

        return $ciclo->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crearPeriodo(CicloEscolar $ciclo, array $data): PeriodoEscolar
    {
        $this->validarPeriodoEnCiclo($ciclo, $data);

        $periodo = PeriodoEscolar::query()->create([
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => $data['clave'],
            'nombre' => $data['nombre'],
            'tipo_periodo' => $data['tipo_periodo'],
            'numero_periodo' => (int) $data['numero_periodo'],
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin' => $data['fecha_fin'],
            'fecha_inicio_inscripcion' => $data['fecha_inicio_inscripcion'] ?? null,
            'fecha_fin_inscripcion' => $data['fecha_fin_inscripcion'] ?? null,
            'fecha_inicio_calificaciones' => $data['fecha_inicio_calificaciones'] ?? null,
            'fecha_fin_calificaciones' => $data['fecha_fin_calificaciones'] ?? null,
            'activo' => (bool) ($data['activo'] ?? true),
            'estatus' => ($data['activo'] ?? true) ? 'activo' : 'inactivo',
            'metadata' => $data['metadata'] ?? null,
        ]);

        return $periodo->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizarPeriodo(PeriodoEscolar $periodo, array $data): PeriodoEscolar
    {
        $ciclo = $periodo->cicloEscolar ?? CicloEscolar::query()->findOrFail($periodo->ciclo_escolar_id);
        $merged = array_merge($periodo->only([
            'clave', 'nombre', 'tipo_periodo', 'numero_periodo', 'fecha_inicio', 'fecha_fin',
            'fecha_inicio_inscripcion', 'fecha_fin_inscripcion',
            'fecha_inicio_calificaciones', 'fecha_fin_calificaciones', 'activo', 'metadata',
        ]), $data);

        $this->validarPeriodoEnCiclo($ciclo, $merged, $periodo->id);

        $periodo->fill([
            'clave' => $merged['clave'],
            'nombre' => $merged['nombre'],
            'tipo_periodo' => $merged['tipo_periodo'],
            'numero_periodo' => (int) $merged['numero_periodo'],
            'fecha_inicio' => $merged['fecha_inicio'],
            'fecha_fin' => $merged['fecha_fin'],
            'fecha_inicio_inscripcion' => $merged['fecha_inicio_inscripcion'] ?? null,
            'fecha_fin_inscripcion' => $merged['fecha_fin_inscripcion'] ?? null,
            'fecha_inicio_calificaciones' => $merged['fecha_inicio_calificaciones'] ?? null,
            'fecha_fin_calificaciones' => $merged['fecha_fin_calificaciones'] ?? null,
            'activo' => (bool) ($merged['activo'] ?? true),
            'metadata' => $merged['metadata'] ?? null,
        ]);
        $periodo->estatus = $periodo->activo ? 'activo' : 'inactivo';
        $periodo->save();

        return $periodo->fresh();
    }

    public function activarPeriodo(PeriodoEscolar $periodo, bool $activo): PeriodoEscolar
    {
        $periodo->activo = $activo;
        $periodo->estatus = $activo ? 'activo' : 'inactivo';
        $periodo->save();

        return $periodo->fresh();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function queryCiclos(array $filters = []): Builder
    {
        $q = CicloEscolar::query()->withCount('periodosEscolares');

        if (($filters['activo'] ?? '') !== '') {
            $q->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        if (($filters['anio'] ?? '') !== '') {
            $anio = (int) $filters['anio'];
            $q->whereYear('fecha_inicio', '<=', $anio)->whereYear('fecha_fin', '>=', $anio);
        }

        if (($filters['search'] ?? '') !== '') {
            $term = '%'.trim((string) $filters['search']).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('clave', 'like', $term)->orWhere('nombre', 'like', $term);
            });
        }

        return $q->orderByDesc('fecha_inicio');
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function queryPeriodos(array $filters = []): Builder
    {
        $q = PeriodoEscolar::query()->with('cicloEscolar:id,clave,nombre');

        if (($filters['ciclo_escolar_id'] ?? '') !== '') {
            $q->where('ciclo_escolar_id', (int) $filters['ciclo_escolar_id']);
        }

        if (($filters['activo'] ?? '') !== '') {
            $q->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        return $q->orderBy('ciclo_escolar_id')->orderBy('numero_periodo');
    }

    private function marcarComoActualInterno(CicloEscolar $ciclo): void
    {
        CicloEscolar::query()->where('id', '!=', $ciclo->id)->update(['es_actual' => false]);
        $ciclo->es_actual = true;
        $ciclo->save();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validarPeriodoEnCiclo(CicloEscolar $ciclo, array $data, ?int $ignorePeriodoId = null): void
    {
        $inicio = Carbon::parse($data['fecha_inicio'])->startOfDay();
        $fin = Carbon::parse($data['fecha_fin'])->startOfDay();

        if ($inicio->gt($fin)) {
            throw ValidationException::withMessages([
                'fecha_fin' => ['La fecha de fin debe ser posterior o igual a la fecha de inicio.'],
            ]);
        }

        $metadata = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];
        $permiteExcepcion = (bool) ($metadata['permite_rango_fuera_ciclo'] ?? false);

        if (! $permiteExcepcion) {
            $cicloInicio = $ciclo->fecha_inicio?->startOfDay();
            $cicloFin = $ciclo->fecha_fin?->startOfDay();
            if ($cicloInicio && $inicio->lt($cicloInicio)) {
                throw ValidationException::withMessages([
                    'fecha_inicio' => ['El periodo debe iniciar dentro del rango del ciclo escolar.'],
                ]);
            }
            if ($cicloFin && $fin->gt($cicloFin)) {
                throw ValidationException::withMessages([
                    'fecha_fin' => ['El periodo debe concluir dentro del rango del ciclo escolar.'],
                ]);
            }
        }

        $dup = PeriodoEscolar::query()
            ->where('ciclo_escolar_id', $ciclo->id)
            ->where('tipo_periodo', $data['tipo_periodo'])
            ->where('numero_periodo', (int) $data['numero_periodo'])
            ->when($ignorePeriodoId, fn (Builder $q) => $q->where('id', '!=', $ignorePeriodoId))
            ->exists();

        if ($dup) {
            throw ValidationException::withMessages([
                'numero_periodo' => ['Ya existe un periodo con el mismo tipo y número en este ciclo.'],
            ]);
        }
    }
}
