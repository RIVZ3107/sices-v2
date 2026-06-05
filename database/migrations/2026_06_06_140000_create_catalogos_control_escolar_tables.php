<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('estatus_academicos')) {
            Schema::create('estatus_academicos', function (Blueprint $table): void {
                $table->id();
                $table->string('clave', 40)->unique();
                $table->string('nombre', 120);
                $table->string('descripcion', 255)->nullable();
                $table->string('color', 20)->nullable();
                $table->unsignedSmallInteger('orden')->default(0);
                $table->boolean('activo')->default(true);
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('estatus_matricula')) {
            Schema::create('estatus_matricula', function (Blueprint $table): void {
                $table->id();
                $table->string('clave', 40)->unique();
                $table->string('nombre', 120);
                $table->string('descripcion', 255)->nullable();
                $table->string('color', 20)->nullable();
                $table->boolean('bloquea_operacion')->default(false);
                $table->unsignedSmallInteger('orden')->default(0);
                $table->boolean('activo')->default(true);
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('escalas_calificacion')) {
            Schema::create('escalas_calificacion', function (Blueprint $table): void {
                $table->id();
                $table->string('clave', 40)->unique();
                $table->string('nombre', 120);
                $table->string('tipo', 40);
                $table->decimal('calificacion_minima', 8, 2)->default(0);
                $table->decimal('calificacion_maxima', 8, 2)->default(10);
                $table->decimal('calificacion_aprobatoria', 8, 2)->default(6);
                $table->boolean('permite_decimales')->default(true);
                $table->unsignedTinyInteger('decimales')->default(1);
                $table->boolean('permite_acreditado')->default(false);
                $table->boolean('activo')->default(true);
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('escalas_calificacion');
        Schema::dropIfExists('estatus_matricula');
        Schema::dropIfExists('estatus_academicos');
    }
};
