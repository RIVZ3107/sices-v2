<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntidadFederativa extends Model
{
    use SoftDeletes;

    protected $table = 'entidades_federativas';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'clave_entidad',
        'nombre',
        'nombre_oficial',
        'abreviatura',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function municipios(): HasMany
    {
        return $this->hasMany(Municipio::class, 'entidad_federativa_id');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('estatus', 'activo');
    }

    public function scopePorClave(Builder $query, string $clave): Builder
    {
        return $query->where('clave_entidad', str_pad(trim($clave), 2, '0', STR_PAD_LEFT));
    }

    public function scopePorAbreviatura(Builder $query, string $abreviatura): Builder
    {
        return $query->where('abreviatura', trim($abreviatura));
    }
}
