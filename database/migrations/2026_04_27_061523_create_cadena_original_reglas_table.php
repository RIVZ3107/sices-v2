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
        Schema::create('cadena_original_reglas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->foreignId('nivel_academico_id')->nullable()->constrained('niveles_academicos')->nullOnDelete();
            $table->string('codigo', 120)->unique();
            $table->enum('tipo_documento', ['certificado', 'titulo', 'grado']);
            $table->unsignedInteger('version')->default(1);
            $table->text('descripcion')->nullable();
            $table->json('estructura_campos')->nullable();
            $table->json('normalizacion')->nullable();
            $table->boolean('activo')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['subsistema_id', 'tipo_documento']);
            $table->index(['nivel_academico_id', 'tipo_documento']);
            $table->index(['tipo_documento', 'version']);
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cadena_original_reglas');
    }
};
