<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoPayload extends Model
{
    protected $table = 'documento_payloads';

    protected $fillable = [
        'documento_academico_id',
        'tipo',
        'version',
        'payload_json',
        'payload_hash',
        'activo',
        'created_by',
    ];

    protected $casts = [
        'payload_json' => 'array',
        'activo' => 'boolean',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
