<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConfiguracionVisualSistema extends Model
{
    protected $table = 'configuracion_visual_sistema';

    protected $fillable = [
        'nombre_configuracion',
        'activo',
        'app_name',
        'app_subtitle',
        'logo_path',
        'escudo_path',
        'favicon_path',
        'sidebar_image_path',
        'login_background_path',
        'primary_color',
        'secondary_color',
        'accent_color',
        'success_color',
        'warning_color',
        'danger_color',
        'info_color',
        'sidebar_bg_color',
        'sidebar_text_color',
        'topbar_bg_color',
        'content_bg_color',
        'card_radius',
        'card_shadow',
        'font_family',
        'theme_mode',
        'metadata',
        'creado_por',
        'publicado_por',
        'publicado_en',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'metadata' => 'array',
            'publicado_en' => 'datetime',
        ];
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function publicadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'publicado_por');
    }

    public function auditorias(): HasMany
    {
        return $this->hasMany(ConfiguracionVisualAuditoria::class, 'configuracion_visual_sistema_id');
    }
}
