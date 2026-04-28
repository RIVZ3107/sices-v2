<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentoVersion extends Model
{
    protected $table = 'documento_versiones';

    protected $fillable = [
        'documento_academico_id',
        'documento_payload_id',
        'cadena_original_generada_id',
        'tipo',
        'version',
        'contenido',
        'storage_disk',
        'storage_path',
        'sha256',
        'size_bytes',
        'activo',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function documentoPayload(): BelongsTo
    {
        return $this->belongsTo(DocumentoPayload::class);
    }

    public function cadenaOriginalGenerada(): BelongsTo
    {
        return $this->belongsTo(CadenaOriginalGenerada::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documentoFirmas(): HasMany
    {
        return $this->hasMany(DocumentoFirma::class, 'documento_version_id');
    }
}
