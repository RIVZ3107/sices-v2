<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Region extends Model
{
    use SoftDeletes;

    protected $table = 'regiones';

    protected $fillable = [
        'subsistema_id',
        'clave',
        'nombre',
        'nombre_corto',
        'descripcion',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function instituciones(): HasMany
    {
        return $this->hasMany(Institucion::class);
    }

    public function sedes(): HasMany
    {
        return $this->hasMany(Sede::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'usuario_regiones')
            ->withPivot('metadata')
            ->withTimestamps();
    }
}
