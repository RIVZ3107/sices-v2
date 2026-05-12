<?php

declare(strict_types=1);

namespace Database\Seeders\Sistema;

use App\Models\ConfiguracionVisualSistema;
use Illuminate\Database\Seeder;

class ConfiguracionVisualSistemaSeeder extends Seeder
{
    public function run(): void
    {
        if (ConfiguracionVisualSistema::query()->exists()) {
            return;
        }

        ConfiguracionVisualSistema::query()->create([
            'nombre_configuracion' => 'Institucional SICES v2',
            'activo' => true,
            'app_name' => 'SICES v2',
            'app_subtitle' => 'Control Escolar para Educación Superior',
            'primary_color' => '#0B5ED7',
            'secondary_color' => '#003B73',
            'accent_color' => '#00A3FF',
            'success_color' => '#198754',
            'warning_color' => '#FFC107',
            'danger_color' => '#DC3545',
            'info_color' => '#0DCAF0',
            'sidebar_bg_color' => '#001F3F',
            'sidebar_text_color' => '#FFFFFF',
            'topbar_bg_color' => '#FFFFFF',
            'content_bg_color' => '#F5F7FB',
            'card_radius' => '18px',
            'card_shadow' => 'soft',
            'font_family' => 'Inter, system-ui, sans-serif',
            'theme_mode' => 'institucional',
            'metadata' => ['origen' => 'seed_inicial'],
        ]);
    }
}
