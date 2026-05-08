<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grupo extends Model
{
    protected $table = 'grupos';

    protected $fillable = [
        'oferta_academica_id',
        'clave',
        'nombre',
        'semestre',
        'turno',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'semestre' => 'integer',
        'metadata' => 'array',
    ];

    public function ofertaAcademica(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class);
    }

    public function inscripciones(): HasMany
    {
        return $this->hasMany(InscripcionPeriodo::class);
    }
}
