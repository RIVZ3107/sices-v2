<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VentanaOperacion extends Model
{
    use SoftDeletes;

    protected $table = 'ventanas_operacion';

    protected $fillable = [
        'ciclo_escolar_id',
        'subsistema_id',
        'region_id',
        'institucion_id',
        'sede_id',
        'proceso',
        'fecha_apertura',
        'fecha_cierre',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }
}
