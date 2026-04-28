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
        Schema::create('plantillas_documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('nivel_academico_id')->nullable()->constrained('niveles_academicos')->nullOnDelete();
            $table->enum('tipo_documento', ['certificado', 'titulo', 'grado']);
            $table->enum('motor', ['jasper', 'dompdf', 'browsershot']);
            $table->string('codigo', 120)->unique();
            $table->unsignedInteger('version')->default(1);
            $table->string('nombre', 180);
            $table->text('descripcion')->nullable();
            $table->string('ruta_template', 255)->nullable();
            $table->json('parametros')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['subsistema_id', 'tipo_documento']);
            $table->index(['institucion_id', 'tipo_documento']);
            $table->index(['nivel_academico_id', 'tipo_documento']);
            $table->index(['motor', 'activo']);
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plantillas_documentos');
    }
};
