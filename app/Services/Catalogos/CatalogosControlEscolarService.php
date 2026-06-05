<?php

declare(strict_types=1);

namespace App\Services\Catalogos;

use App\Enums\ControlEscolar\TipoEscalaCalificacion;
use App\Models\EscalaCalificacion;
use App\Models\EstatusAcademico;
use App\Models\EstatusMatricula;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

final class CatalogosControlEscolarService
{
    /**
     * @return array<string, mixed>
     */
    public function resumen(): array
    {
        return [
            'estatus_academicos' => $this->resumenEstatusAcademicos(),
            'estatus_matricula' => $this->resumenEstatusMatricula(),
            'escalas_calificacion' => $this->resumenEscalasCalificacion(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function resumenEstatusAcademicos(): array
    {
        $total = EstatusAcademico::query()->count();
        $activos = EstatusAcademico::query()->where('activo', true)->count();

        return [
            'total' => $total,
            'activos' => $activos,
            'inactivos' => max(0, $total - $activos),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function resumenEstatusMatricula(): array
    {
        $total = EstatusMatricula::query()->count();
        $activos = EstatusMatricula::query()->where('activo', true)->count();
        $bloquean = EstatusMatricula::query()->where('bloquea_operacion', true)->where('activo', true)->count();

        return [
            'total' => $total,
            'activos' => $activos,
            'inactivos' => max(0, $total - $activos),
            'bloquean_operacion' => $bloquean,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function resumenEscalasCalificacion(): array
    {
        $total = EscalaCalificacion::query()->count();
        $activos = EscalaCalificacion::query()->where('activo', true)->count();

        return [
            'total' => $total,
            'activos' => $activos,
            'inactivos' => max(0, $total - $activos),
            'sin_escala_activa' => $activos === 0,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function queryEstatusAcademicos(array $filters): Builder
    {
        $q = EstatusAcademico::query()->orderBy('orden')->orderBy('nombre');

        if (isset($filters['activo']) && $filters['activo'] !== '' && $filters['activo'] !== null) {
            $q->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['q'])) {
            $term = '%'.trim((string) $filters['q']).'%';
            $q->where(function (Builder $inner) use ($term): void {
                $inner->where('clave', 'like', $term)
                    ->orWhere('nombre', 'like', $term)
                    ->orWhere('descripcion', 'like', $term);
            });
        }

        return $q;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function queryEstatusMatricula(array $filters): Builder
    {
        $q = EstatusMatricula::query()->orderBy('orden')->orderBy('nombre');

        if (isset($filters['activo']) && $filters['activo'] !== '' && $filters['activo'] !== null) {
            $q->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['q'])) {
            $term = '%'.trim((string) $filters['q']).'%';
            $q->where(function (Builder $inner) use ($term): void {
                $inner->where('clave', 'like', $term)
                    ->orWhere('nombre', 'like', $term)
                    ->orWhere('descripcion', 'like', $term);
            });
        }

        return $q;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function queryEscalasCalificacion(array $filters): Builder
    {
        $q = EscalaCalificacion::query()->orderBy('nombre');

        if (isset($filters['activo']) && $filters['activo'] !== '' && $filters['activo'] !== null) {
            $q->where('activo', filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['tipo'])) {
            $q->where('tipo', (string) $filters['tipo']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.trim((string) $filters['q']).'%';
            $q->where(function (Builder $inner) use ($term): void {
                $inner->where('clave', 'like', $term)
                    ->orWhere('nombre', 'like', $term);
            });
        }

        return $q;
    }

    /**
     * @return array<string, mixed>
     */
    public function presentarEstatusAcademico(EstatusAcademico $model): array
    {
        return [
            'id' => $model->id,
            'clave' => $model->clave,
            'nombre' => $model->nombre,
            'descripcion' => $model->descripcion,
            'color' => $model->color,
            'orden' => (int) $model->orden,
            'activo' => (bool) $model->activo,
            'estatus' => $model->activo ? 'activo' : 'inactivo',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentarEstatusMatricula(EstatusMatricula $model): array
    {
        return [
            'id' => $model->id,
            'clave' => $model->clave,
            'nombre' => $model->nombre,
            'descripcion' => $model->descripcion,
            'color' => $model->color,
            'bloquea_operacion' => (bool) $model->bloquea_operacion,
            'orden' => (int) $model->orden,
            'activo' => (bool) $model->activo,
            'estatus' => $model->activo ? 'activo' : 'inactivo',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentarEscalaCalificacion(EscalaCalificacion $model): array
    {
        $tipo = TipoEscalaCalificacion::tryFrom((string) $model->tipo);

        return [
            'id' => $model->id,
            'clave' => $model->clave,
            'nombre' => $model->nombre,
            'tipo' => $model->tipo,
            'tipo_label' => $tipo?->label() ?? $model->tipo,
            'calificacion_minima' => (float) $model->calificacion_minima,
            'calificacion_maxima' => (float) $model->calificacion_maxima,
            'calificacion_aprobatoria' => (float) $model->calificacion_aprobatoria,
            'permite_decimales' => (bool) $model->permite_decimales,
            'decimales' => (int) $model->decimales,
            'permite_acreditado' => (bool) $model->permite_acreditado,
            'activo' => (bool) $model->activo,
            'estatus' => $model->activo ? 'activo' : 'inactivo',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crearEstatusAcademico(array $data): EstatusAcademico
    {
        return EstatusAcademico::query()->create([
            'clave' => $data['clave'],
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'color' => $data['color'] ?? null,
            'orden' => (int) ($data['orden'] ?? 0),
            'activo' => (bool) ($data['activo'] ?? true),
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizarEstatusAcademico(EstatusAcademico $model, array $data): EstatusAcademico
    {
        $model->fill([
            'clave' => $data['clave'] ?? $model->clave,
            'nombre' => $data['nombre'] ?? $model->nombre,
            'descripcion' => array_key_exists('descripcion', $data) ? $data['descripcion'] : $model->descripcion,
            'color' => array_key_exists('color', $data) ? $data['color'] : $model->color,
            'orden' => array_key_exists('orden', $data) ? (int) $data['orden'] : $model->orden,
            'activo' => array_key_exists('activo', $data) ? (bool) $data['activo'] : $model->activo,
            'metadata' => array_key_exists('metadata', $data) ? $data['metadata'] : $model->metadata,
        ]);
        $model->save();

        return $model->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crearEstatusMatricula(array $data): EstatusMatricula
    {
        return EstatusMatricula::query()->create([
            'clave' => $data['clave'],
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'color' => $data['color'] ?? null,
            'bloquea_operacion' => (bool) ($data['bloquea_operacion'] ?? false),
            'orden' => (int) ($data['orden'] ?? 0),
            'activo' => (bool) ($data['activo'] ?? true),
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizarEstatusMatricula(EstatusMatricula $model, array $data): EstatusMatricula
    {
        $model->fill([
            'clave' => $data['clave'] ?? $model->clave,
            'nombre' => $data['nombre'] ?? $model->nombre,
            'descripcion' => array_key_exists('descripcion', $data) ? $data['descripcion'] : $model->descripcion,
            'color' => array_key_exists('color', $data) ? $data['color'] : $model->color,
            'bloquea_operacion' => array_key_exists('bloquea_operacion', $data) ? (bool) $data['bloquea_operacion'] : $model->bloquea_operacion,
            'orden' => array_key_exists('orden', $data) ? (int) $data['orden'] : $model->orden,
            'activo' => array_key_exists('activo', $data) ? (bool) $data['activo'] : $model->activo,
            'metadata' => array_key_exists('metadata', $data) ? $data['metadata'] : $model->metadata,
        ]);
        $model->save();

        return $model->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crearEscalaCalificacion(array $data): EscalaCalificacion
    {
        $this->validarRangoEscala($data);

        return EscalaCalificacion::query()->create([
            'clave' => $data['clave'],
            'nombre' => $data['nombre'],
            'tipo' => $data['tipo'],
            'calificacion_minima' => $data['calificacion_minima'] ?? 0,
            'calificacion_maxima' => $data['calificacion_maxima'] ?? 10,
            'calificacion_aprobatoria' => $data['calificacion_aprobatoria'] ?? 6,
            'permite_decimales' => (bool) ($data['permite_decimales'] ?? true),
            'decimales' => (int) ($data['decimales'] ?? 1),
            'permite_acreditado' => (bool) ($data['permite_acreditado'] ?? false),
            'activo' => (bool) ($data['activo'] ?? true),
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizarEscalaCalificacion(EscalaCalificacion $model, array $data): EscalaCalificacion
    {
        $merged = array_merge($model->only([
            'calificacion_minima', 'calificacion_maxima', 'calificacion_aprobatoria',
        ]), array_intersect_key($data, array_flip([
            'calificacion_minima', 'calificacion_maxima', 'calificacion_aprobatoria',
        ])));
        $this->validarRangoEscala($merged);

        $model->fill([
            'clave' => $data['clave'] ?? $model->clave,
            'nombre' => $data['nombre'] ?? $model->nombre,
            'tipo' => $data['tipo'] ?? $model->tipo,
            'calificacion_minima' => $data['calificacion_minima'] ?? $model->calificacion_minima,
            'calificacion_maxima' => $data['calificacion_maxima'] ?? $model->calificacion_maxima,
            'calificacion_aprobatoria' => $data['calificacion_aprobatoria'] ?? $model->calificacion_aprobatoria,
            'permite_decimales' => array_key_exists('permite_decimales', $data) ? (bool) $data['permite_decimales'] : $model->permite_decimales,
            'decimales' => array_key_exists('decimales', $data) ? (int) $data['decimales'] : $model->decimales,
            'permite_acreditado' => array_key_exists('permite_acreditado', $data) ? (bool) $data['permite_acreditado'] : $model->permite_acreditado,
            'activo' => array_key_exists('activo', $data) ? (bool) $data['activo'] : $model->activo,
            'metadata' => array_key_exists('metadata', $data) ? $data['metadata'] : $model->metadata,
        ]);
        $model->save();

        return $model->fresh();
    }

    public function activarEstatusAcademico(EstatusAcademico $model, bool $activo): EstatusAcademico
    {
        $model->activo = $activo;
        $model->save();

        return $model->fresh();
    }

    public function activarEstatusMatricula(EstatusMatricula $model, bool $activo): EstatusMatricula
    {
        $model->activo = $activo;
        $model->save();

        return $model->fresh();
    }

    public function activarEscalaCalificacion(EscalaCalificacion $model, bool $activo): EscalaCalificacion
    {
        $model->activo = $activo;
        $model->save();

        return $model->fresh();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public function tiposEscalaCalificacion(): array
    {
        return array_map(
            static fn (TipoEscalaCalificacion $tipo) => ['value' => $tipo->value, 'label' => $tipo->label()],
            TipoEscalaCalificacion::cases(),
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validarRangoEscala(array $data): void
    {
        $min = (float) ($data['calificacion_minima'] ?? 0);
        $max = (float) ($data['calificacion_maxima'] ?? 10);
        $aprob = (float) ($data['calificacion_aprobatoria'] ?? 6);

        if ($max < $min) {
            throw ValidationException::withMessages([
                'calificacion_maxima' => ['La calificación máxima debe ser mayor o igual a la mínima.'],
            ]);
        }

        if ($aprob < $min || $aprob > $max) {
            throw ValidationException::withMessages([
                'calificacion_aprobatoria' => ['La calificación aprobatoria debe estar dentro del rango definido.'],
            ]);
        }
    }
}
