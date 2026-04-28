<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlantillaDocumento extends Model
{
    use SoftDeletes;

    protected $table = 'plantillas_documentos';

    protected $fillable = [
        'subsistema_id',
        'institucion_id',
        'nivel_academico_id',
        'tipo_documento',
        'motor',
        'codigo',
        'version',
        'nombre',
        'descripcion',
        'ruta_template',
        'parametros',
        'metadata',
        'activo',
    ];

    protected $casts = [
        'parametros' => 'array',
        'metadata' => 'array',
        'activo' => 'boolean',
    ];

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class);
    }

    public function nivelAcademico(): BelongsTo
    {
        return $this->belongsTo(NivelAcademico::class);
    }
}
