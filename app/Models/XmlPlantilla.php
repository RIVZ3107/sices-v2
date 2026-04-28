<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class XmlPlantilla extends Model
{
    use SoftDeletes;

    protected $table = 'xml_plantillas';

    protected $fillable = [
        'subsistema_id',
        'nivel_academico_id',
        'tipo_documento',
        'codigo',
        'version',
        'namespace',
        'schema_location',
        'estructura',
        'validaciones',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'estructura' => 'array',
        'validaciones' => 'array',
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
}
