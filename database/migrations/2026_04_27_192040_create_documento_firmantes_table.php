<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documento_firmantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            $table->foreignId('firmante_autorizado_id')->constrained('firmantes_autorizados')->restrictOnDelete();
            $table->enum('rol_firma', ['firmante_principal', 'responsable_academico', 'autoridad_institucional', 'validador']);
            $table->unsignedTinyInteger('orden')->default(1);
            $table->enum('estatus', ['pendiente', 'firmado', 'omitido', 'cancelado'])->default('pendiente');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['documento_academico_id', 'estatus']);
            $table->index('firmante_autorizado_id');
            $table->index('rol_firma');
            $table->unique(['documento_academico_id', 'firmante_autorizado_id', 'rol_firma'], 'documento_firmantes_unq');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documento_firmantes');
    }
};
