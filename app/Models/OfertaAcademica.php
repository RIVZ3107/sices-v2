<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfertaAcademica extends Model
{
    use SoftDeletes;

    /**
     * TODO (esquema): la columna `modalidad` sigue el enum SEP (escolarizada|mixta|no_escolarizada).
     * La modalidad operativa UPN (presencial|semipresencial|en_linea) se declara de forma transitoria en
     * `metadata.modalidad_upn` hasta una migración que amplíe el modelo sin romper datos existentes.
     */
    protected $table = 'ofertas_academicas';

    protected $fillable = [
        'institucion_id',
        'sede_id',
        'programa_estudio_id',
        'plan_estudio_id',
        'ciclo_escolar_id',
        'clave',
        'modalidad',
        'capacidad',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'capacidad' => 'integer',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function programaEstudio(): BelongsTo
    {
        return $this->belongsTo(ProgramaEstudio::class);
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class);
    }

    public function cicloEscolarInicio(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class, 'ciclo_escolar_id');
    }

    public function cicloEscolarFin(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class, 'ciclo_escolar_id');
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }
}
