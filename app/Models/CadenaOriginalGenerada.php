<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CadenaOriginalGenerada extends Model
{
    protected $table = 'cadena_original_generadas';

    protected $fillable = [
        'documento_academico_id',
        'documento_payload_id',
        'cadena_original_regla_id',
        'version',
        'payload_hash',
        'cadena_original',
        'cadena_hash',
        'estado',
        'error_message',
        'metadata',
        'created_by',
    ];

    protected $casts = [
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

    public function cadenaOriginalRegla(): BelongsTo
    {
        return $this->belongsTo(CadenaOriginalRegla::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documentoVersiones(): HasMany
    {
        return $this->hasMany(DocumentoVersion::class);
    }
}
