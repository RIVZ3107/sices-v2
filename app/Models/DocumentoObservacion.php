<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoObservacion extends Model
{
    protected $table = 'documento_observaciones';

    protected $fillable = [
        'documento_academico_id',
        'tipo',
        'seccion',
        'observacion',
        'estado',
        'prioridad',
        'creada_por',
        'atendida_por',
        'atendida_at',
        'respuesta',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'atendida_at' => 'datetime',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function creadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creada_por');
    }

    public function atendidaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'atendida_por');
    }
}
