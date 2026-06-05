<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstatusAcademico extends Model
{
    use SoftDeletes;

    protected $table = 'estatus_academicos';

    protected $fillable = [
        'clave',
        'nombre',
        'descripcion',
        'color',
        'orden',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];
}
