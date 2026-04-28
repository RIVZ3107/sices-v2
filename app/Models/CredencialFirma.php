<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CredencialFirma extends Model
{
    use SoftDeletes;

    protected $table = 'credenciales_firma';

    protected $fillable = [
        'firmante_autorizado_id',
        'tipo',
        'alias',
        'serial_certificado',
        'certificado_publico_path',
        'llave_privada_path',
        'pfx_path',
        'password_encrypted',
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

    public function firmanteAutorizado(): BelongsTo
    {
        return $this->belongsTo(FirmanteAutorizado::class);
    }
}
