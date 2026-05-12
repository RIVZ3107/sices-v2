<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Si una ejecución anterior creó solo `configuracion_visual_sistema` y falló después,
        // volver a migrar no debe intentar CREATE de nuevo (1050 Table already exists).
        if (! Schema::hasTable('configuracion_visual_sistema')) {
            Schema::create('configuracion_visual_sistema', function (Blueprint $table): void {
                $table->id();
                $table->string('nombre_configuracion');
                $table->boolean('activo')->default(false);
                $table->string('app_name')->default('SICES v2');
                $table->string('app_subtitle')->nullable();
                $table->string('logo_path')->nullable();
                $table->string('escudo_path')->nullable();
                $table->string('favicon_path')->nullable();
                $table->string('sidebar_image_path')->nullable();
                $table->string('login_background_path')->nullable();
                $table->string('primary_color', 32)->default('#0B5ED7');
                $table->string('secondary_color', 32)->default('#003B73');
                $table->string('accent_color', 32)->default('#00A3FF');
                $table->string('success_color', 32)->default('#198754');
                $table->string('warning_color', 32)->default('#FFC107');
                $table->string('danger_color', 32)->default('#DC3545');
                $table->string('info_color', 32)->default('#0DCAF0');
                $table->string('sidebar_bg_color', 32)->default('#001F3F');
                $table->string('sidebar_text_color', 32)->default('#FFFFFF');
                $table->string('topbar_bg_color', 32)->default('#FFFFFF');
                $table->string('content_bg_color', 32)->default('#F5F7FB');
                $table->string('card_radius', 16)->default('18px');
                $table->string('card_shadow', 32)->default('soft');
                $table->string('font_family')->default('Inter, system-ui, sans-serif');
                $table->string('theme_mode', 24)->default('institucional');
                $table->json('metadata')->nullable();
                $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('publicado_por')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('publicado_en')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('configuracion_visual_auditoria')) {
            Schema::create('configuracion_visual_auditoria', function (Blueprint $table): void {
                $table->id();
                // Nombre de FK explícito: el autogenerado supera el límite de 64 caracteres de MySQL.
                $table->unsignedBigInteger('configuracion_visual_sistema_id')->nullable();
                $table->foreign('configuracion_visual_sistema_id', 'cv_aud_cv_sistema_id_fk')
                    ->references('id')
                    ->on('configuracion_visual_sistema')
                    ->nullOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('evento', 80);
                $table->json('valores_anteriores')->nullable();
                $table->json('valores_nuevos')->nullable();
                $table->string('ip', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_visual_auditoria');
        Schema::dropIfExists('configuracion_visual_sistema');
    }
};
