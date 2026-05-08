<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MateriaCursada extends Model
{
    use SoftDeletes;

    protected $table = 'materias_cursadas';

    protected $fillable = [
        'alumno_id',
        'matricula_id',
        'inscripcion_periodo_id',
        'carga_academica_id',
        'materia_id',
        'plan_materia_id',
        'ciclo_escolar_id',
        'clave',
        'nombre',
        'calificacion',
        'calificacion_final',
        'calificacion_texto',
        'periodo',
        'semestre',
        'tipo_periodo_curricular',
        'numero_periodo_curricular',
        'etiqueta_periodo_curricular',
        'orden',
        'creditos',
        'tipo',
        'tipo_evaluacion',
        'estado',
        'estatus_acreditacion',
        'metadata',
    ];

    protected $casts = [
        'calificacion' => 'decimal:2',
        'calificacion_final' => 'decimal:2',
        'semestre' => 'integer',
        'numero_periodo_curricular' => 'integer',
        'orden' => 'integer',
        'creditos' => 'integer',
        'metadata' => 'array',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function inscripcionPeriodo(): BelongsTo
    {
        return $this->belongsTo(InscripcionPeriodo::class);
    }

    public function cargaAcademica(): BelongsTo
    {
        return $this->belongsTo(CargaAcademica::class);
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class);
    }

    public function planMateria(): BelongsTo
    {
        return $this->belongsTo(PlanMateria::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }
}
