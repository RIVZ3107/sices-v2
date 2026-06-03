<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalificacionHistorial extends Model
{
    protected $table = 'calificacion_historiales';

    protected $fillable = [
        'materia_cursada_id',
        'user_id',
        'valor_anterior',
        'valor_nuevo',
        'motivo',
        'origen',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function materiaCursada(): BelongsTo
    {
        return $this->belongsTo(MateriaCursada::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
