<?php

namespace App\Models;

use App\Support\Certificacion\PeriodoCurricularDecMapper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanMateria extends Model
{
    protected $table = 'plan_materias';

    protected $fillable = [
        'plan_estudio_id',
        'materia_id',
        'clave_materia',
        'nombre_materia',
        'semestre',
        'tipo_periodo_curricular',
        'numero_periodo_curricular',
        'etiqueta_periodo_curricular',
        'orden',
        'creditos',
        'obligatoria',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'semestre' => 'integer',
        'numero_periodo_curricular' => 'integer',
        'orden' => 'integer',
        'creditos' => 'integer',
        'obligatoria' => 'boolean',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (PlanMateria $pm): void {
            PeriodoCurricularDecMapper::aplicarDefaultsPlanMateria($pm);
        });
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class);
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class);
    }

    public function cargasAcademicas(): HasMany
    {
        return $this->hasMany(CargaAcademica::class);
    }
}
