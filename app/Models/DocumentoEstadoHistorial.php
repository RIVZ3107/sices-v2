<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoEstadoHistorial extends Model
{
    protected $table = 'documento_estados_historial';

    protected $fillable = [
        'documento_academico_id',
        'campo',
        'estado_anterior',
        'estado_nuevo',
        'motivo',
        'changed_by',
        'ip',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
