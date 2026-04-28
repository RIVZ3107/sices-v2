<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoFirma extends Model
{
    protected $table = 'documento_firmas';

    protected $fillable = [
        'documento_academico_id',
        'documento_version_id',
        'firma_configuracion_id',
        'firmante_autorizado_id',
        'proveedor',
        'endpoint',
        'estado',
        'folio_digital_sep',
        'xml_firmado',
        'correlation_id',
        'idempotency_key',
        'request_payload',
        'response_payload',
        'http_status',
        'error_message',
        'sent_at',
        'signed_at',
        'created_by',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
        'http_status' => 'integer',
        'sent_at' => 'datetime',
        'signed_at' => 'datetime',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function documentoVersion(): BelongsTo
    {
        return $this->belongsTo(DocumentoVersion::class);
    }

    public function firmaConfiguracion(): BelongsTo
    {
        return $this->belongsTo(FirmaConfiguracion::class);
    }

    public function firmanteAutorizado(): BelongsTo
    {
        return $this->belongsTo(FirmanteAutorizado::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
