<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Municipio extends Model
{
    use SoftDeletes;

    protected $table = 'municipios';

    protected $fillable = [
        'entidad_federativa_id',
        'clave_municipio',
        'nombre',
        'nombre_oficial',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function entidadFederativa(): BelongsTo
    {
        return $this->belongsTo(EntidadFederativa::class, 'entidad_federativa_id');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('estatus', 'activo');
    }

    public function scopePorEntidad(Builder $query, int $entidadId): Builder
    {
        return $query->where('entidad_federativa_id', $entidadId);
    }

    public function scopePorClave(Builder $query, string $clave): Builder
    {
        return $query->where('clave_municipio', str_pad(trim($clave), 3, '0', STR_PAD_LEFT));
    }

    public function getNombreLegibleAttribute(): string
    {
        return $this->nombre !== '' ? $this->nombre : $this->nombre_oficial;
    }
}
