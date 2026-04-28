<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegracionLog extends Model
{
    protected $table = 'integraciones_logs';

    protected $fillable = [
        'documento_academico_id',
        'tipo',
        'endpoint',
        'method',
        'correlation_id',
        'idempotency_key',
        'request_payload',
        'response_payload',
        'http_status',
        'estado',
        'error_message',
        'duration_ms',
        'metadata',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
        'http_status' => 'integer',
        'duration_ms' => 'integer',
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }
}
