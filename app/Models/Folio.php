<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Folio extends Model
{
    protected $fillable = [
        'documento_academico_id',
        'ciclo_escolar_id',
        'subsistema_id',
        'tipo_documento',
        'prefijo',
        'numero',
        'folio_completo',
        'estado',
        'asignado_at',
        'metadata',
    ];

    protected $casts = [
        'numero' => 'integer',
        'asignado_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }
}
