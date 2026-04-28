<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FirmanteAutorizado extends Model
{
    use SoftDeletes;

    protected $table = 'firmantes_autorizados';

    protected $fillable = [
        'subsistema_id',
        'institucion_id',
        'nombre',
        'primer_apellido',
        'segundo_apellido',
        'curp',
        'rfc',
        'cargo',
        'email',
        'telefono',
        'vigencia_inicio',
        'vigencia_fin',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'vigencia_inicio' => 'date',
        'vigencia_fin' => 'date',
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

    public function credencialesFirma(): HasMany
    {
        return $this->hasMany(CredencialFirma::class);
    }

    public function documentoFirmantes(): HasMany
    {
        return $this->hasMany(DocumentoFirmante::class);
    }

    public function documentoFirmas(): HasMany
    {
        return $this->hasMany(DocumentoFirma::class);
    }
}
