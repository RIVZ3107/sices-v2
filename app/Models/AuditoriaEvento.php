<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditoriaEvento extends Model
{
    protected $table = 'auditoria_eventos';

    protected $fillable = [
        'user_id',
        'evento',
        'entidad_tipo',
        'entidad_id',
        'payload',
        'ip',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'payload' => 'array',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
