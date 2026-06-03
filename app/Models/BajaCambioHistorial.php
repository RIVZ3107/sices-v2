<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BajaCambioHistorial extends Model
{
    protected $table = 'bajas_cambios_historiales';

    protected $fillable = [
        'solicitud_id',
        'estado_anterior',
        'estado_nuevo',
        'etapa_anterior',
        'etapa_nueva',
        'comentario',
        'user_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(BajaCambioSolicitud::class, 'solicitud_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
