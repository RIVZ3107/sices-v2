<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UrlShortToken extends Model
{
    protected $table = 'url_short_tokens';

    protected $fillable = [
        'documento_academico_id',
        'token',
        'estado',
        'expires_at',
        'revoked_at',
        'metadata',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }
}
