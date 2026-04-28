<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoFirmante extends Model
{
    protected $table = 'documento_firmantes';

    protected $fillable = [
        'documento_academico_id',
        'firmante_autorizado_id',
        'rol_firma',
        'orden',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'orden' => 'integer',
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function firmanteAutorizado(): BelongsTo
    {
        return $this->belongsTo(FirmanteAutorizado::class);
    }
}
