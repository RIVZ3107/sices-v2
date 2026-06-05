<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PeriodoEscolar extends Model
{
    use SoftDeletes;

    protected $table = 'periodos_escolares';

    protected $fillable = [
        'ciclo_escolar_id',
        'clave',
        'nombre',
        'tipo_periodo',
        'numero_periodo',
        'fecha_inicio',
        'fecha_fin',
        'fecha_inicio_inscripcion',
        'fecha_fin_inscripcion',
        'fecha_inicio_calificaciones',
        'fecha_fin_calificaciones',
        'estatus',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'fecha_inicio_inscripcion' => 'date',
        'fecha_fin_inscripcion' => 'date',
        'fecha_inicio_calificaciones' => 'date',
        'fecha_fin_calificaciones' => 'date',
        'activo' => 'boolean',
        'metadata' => 'array',
        'numero_periodo' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (PeriodoEscolar $periodo): void {
            if ($periodo->isDirty('activo')) {
                $periodo->estatus = $periodo->activo ? 'activo' : 'inactivo';
            }
        });
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function inscripciones(): HasMany
    {
        return $this->hasMany(InscripcionPeriodo::class);
    }
}
