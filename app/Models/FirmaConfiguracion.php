<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FirmaConfiguracion extends Model
{
    use SoftDeletes;

    protected $table = 'firma_configuraciones';

    protected $fillable = [
        'subsistema_id',
        'institucion_id',
        'nivel_academico_id',
        'tipo_documento',
        'proveedor',
        'endpoint',
        'metodo',
        'timeout',
        'requiere_xml_previo',
        'requiere_cadena_original',
        'requiere_sello_local',
        'requiere_firmante',
        'version_firma',
        'headers',
        'parametros',
        'metadata',
        'estatus',
    ];

    protected $casts = [
        'timeout' => 'integer',
        'requiere_xml_previo' => 'boolean',
        'requiere_cadena_original' => 'boolean',
        'requiere_sello_local' => 'boolean',
        'requiere_firmante' => 'boolean',
        'headers' => 'array',
        'parametros' => 'array',
        'metadata' => 'array',
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

    public function documentoFirmas(): HasMany
    {
        return $this->hasMany(DocumentoFirma::class);
    }
}
