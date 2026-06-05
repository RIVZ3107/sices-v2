<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EscalaCalificacion extends Model
{
    use SoftDeletes;

    protected $table = 'escalas_calificacion';

    protected $fillable = [
        'clave',
        'nombre',
        'tipo',
        'calificacion_minima',
        'calificacion_maxima',
        'calificacion_aprobatoria',
        'permite_decimales',
        'decimales',
        'permite_acreditado',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'calificacion_minima' => 'decimal:2',
        'calificacion_maxima' => 'decimal:2',
        'calificacion_aprobatoria' => 'decimal:2',
        'permite_decimales' => 'boolean',
        'decimales' => 'integer',
        'permite_acreditado' => 'boolean',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];
}
