<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calificacion_correcciones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('materia_cursada_id')->constrained('materias_cursadas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('motivo', 120);
            $table->text('descripcion');
            $table->string('estatus', 40)->default('solicitada');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['materia_cursada_id', 'estatus']);
        });

        Schema::create('calificacion_historiales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('materia_cursada_id')->constrained('materias_cursadas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('valor_anterior', 40)->nullable();
            $table->string('valor_nuevo', 40)->nullable();
            $table->string('motivo', 255)->nullable();
            $table->string('origen', 40)->default('captura_manual');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['materia_cursada_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calificacion_historiales');
        Schema::dropIfExists('calificacion_correcciones');
    }
};
