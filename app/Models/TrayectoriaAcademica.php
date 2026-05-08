<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrayectoriaAcademica extends Model
{
    use SoftDeletes;

    protected $table = 'trayectorias_academicas';

    protected $fillable = [
        'alumno_id',
        'matricula_id',
        'fecha_inicio',
        'fecha_fin',
        'promedio',
        'promedio_texto',
        'creditos_obtenidos',
        'creditos_totales',
        'total_materias',
        'materias_aprobadas',
        'materias_reprobadas',
        'asignaturas_cursadas',
        'asignaturas_total',
        'promedio_aprovechamiento',
        'materias_acreditadas',
        'materias_no_acreditadas',
        'estatus_trayectoria',
        'estado',
        'metadata',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'promedio' => 'decimal:2',
        'creditos_obtenidos' => 'integer',
        'creditos_totales' => 'integer',
        'total_materias' => 'integer',
        'materias_aprobadas' => 'integer',
        'materias_reprobadas' => 'integer',
        'asignaturas_cursadas' => 'integer',
        'asignaturas_total' => 'integer',
        'promedio_aprovechamiento' => 'decimal:2',
        'materias_acreditadas' => 'integer',
        'materias_no_acreditadas' => 'integer',
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
}
