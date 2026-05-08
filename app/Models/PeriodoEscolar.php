<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodoEscolar extends Model
{
    protected $table = 'periodos_escolares';

    protected $fillable = [
        'ciclo_escolar_id',
        'clave',
        'nombre',
        'fecha_inicio',
        'fecha_fin',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'metadata' => 'array',
    ];

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function inscripciones(): HasMany
    {
        return $this->hasMany(InscripcionPeriodo::class);
    }
}
