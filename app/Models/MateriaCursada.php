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
        'materia_id',
        'ciclo_escolar_id',
        'clave',
        'nombre',
        'calificacion',
        'calificacion_texto',
        'periodo',
        'semestre',
        'creditos',
        'tipo',
        'estado',
        'metadata',
    ];

    protected $casts = [
        'calificacion' => 'decimal:2',
        'semestre' => 'integer',
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

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }
}
