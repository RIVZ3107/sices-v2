<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('importaciones_materias_historicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('matricula_id')->constrained('matriculas')->restrictOnDelete();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->string('estado', 30)->default('borrador')->index();
            $table->json('filas_payload');
            $table->json('validacion_payload')->nullable();
            $table->json('reconciliacion_payload')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['matricula_id', 'estado'], 'imp_mat_hist_matricula_estado_idx');
            $table->index(['created_at'], 'imp_mat_hist_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('importaciones_materias_historicas');
    }
};
