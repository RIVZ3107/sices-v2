<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CadenaOriginalRegla extends Model
{
    use SoftDeletes;

    protected $table = 'cadena_original_reglas';

    protected $fillable = [
        'subsistema_id',
        'nivel_academico_id',
        'codigo',
        'tipo_documento',
        'version',
        'descripcion',
        'estructura_campos',
        'normalizacion',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'estructura_campos' => 'array',
        'normalizacion' => 'array',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function nivelAcademico(): BelongsTo
    {
        return $this->belongsTo(NivelAcademico::class);
    }

    public function cadenasGeneradas(): HasMany
    {
        return $this->hasMany(CadenaOriginalGenerada::class);
    }
}
