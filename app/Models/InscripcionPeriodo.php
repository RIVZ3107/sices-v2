<?php

namespace App\Models;

use App\Support\Certificacion\PeriodoCurricularDecMapper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InscripcionPeriodo extends Model
{
    protected $table = 'inscripciones_periodo';

    protected $fillable = [
        'matricula_id',
        'ciclo_escolar_id',
        'periodo_escolar_id',
        'grupo_id',
        'semestre',
        'tipo_periodo_curricular',
        'numero_periodo_curricular',
        'etiqueta_periodo_curricular',
        'estatus',
        'fecha_inscripcion',
        'metadata',
    ];

    protected $casts = [
        'semestre' => 'integer',
        'numero_periodo_curricular' => 'integer',
        'fecha_inscripcion' => 'date',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (InscripcionPeriodo $ins): void {
            PeriodoCurricularDecMapper::aplicarDefaultsInscripcion($ins);
        });
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function periodoEscolar(): BelongsTo
    {
        return $this->belongsTo(PeriodoEscolar::class);
    }

    public function grupo(): BelongsTo
    {
        return $this->belongsTo(Grupo::class);
    }

    public function cargasAcademicas(): HasMany
    {
        return $this->hasMany(CargaAcademica::class);
    }
}
