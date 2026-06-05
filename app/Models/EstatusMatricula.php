<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstatusMatricula extends Model
{
    use SoftDeletes;

    protected $table = 'estatus_matricula';

    protected $fillable = [
        'clave',
        'nombre',
        'descripcion',
        'color',
        'bloquea_operacion',
        'orden',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'bloquea_operacion' => 'boolean',
        'orden' => 'integer',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];
}
