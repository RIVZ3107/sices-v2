<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionVisualAuditoria extends Model
{
    protected $table = 'configuracion_visual_auditoria';

    protected $fillable = [
        'configuracion_visual_sistema_id',
        'user_id',
        'evento',
        'valores_anteriores',
        'valores_nuevos',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'valores_anteriores' => 'array',
            'valores_nuevos' => 'array',
        ];
    }

    public function configuracion(): BelongsTo
    {
        return $this->belongsTo(ConfiguracionVisualSistema::class, 'configuracion_visual_sistema_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
