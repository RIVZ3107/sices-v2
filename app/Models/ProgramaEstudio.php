<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProgramaEstudio extends Model
{
    use SoftDeletes;

    protected $table = 'programas_estudio';

    protected $fillable = [
        'nivel_academico_id',
        'subsistema_id',
        'clave',
        'nombre',
        'area_conocimiento',
        'creditos_minimos',
        'duracion_periodos',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'creditos_minimos' => 'integer',
        'duracion_periodos' => 'integer',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function nivelAcademico(): BelongsTo
    {
        return $this->belongsTo(NivelAcademico::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function planesEstudio(): HasMany
    {
        return $this->hasMany(PlanEstudio::class);
    }

    public function ofertasAcademicas(): HasMany
    {
        return $this->hasMany(OfertaAcademica::class);
    }
}
