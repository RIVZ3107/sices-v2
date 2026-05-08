<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Generacion extends Model
{
    protected $table = 'generaciones';

    protected $fillable = [
        'oferta_academica_id',
        'clave',
        'nombre',
        'anio_inicio',
        'anio_fin',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'anio_inicio' => 'integer',
        'anio_fin' => 'integer',
        'metadata' => 'array',
    ];

    public function ofertaAcademica(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class);
    }
}
