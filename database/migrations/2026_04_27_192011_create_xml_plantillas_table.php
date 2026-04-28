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
        Schema::create('xml_plantillas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->foreignId('nivel_academico_id')->nullable()->constrained('niveles_academicos')->nullOnDelete();
            $table->enum('tipo_documento', ['certificado', 'titulo', 'grado']);
            $table->string('codigo', 120)->unique();
            $table->unsignedInteger('version')->default(1);
            $table->string('namespace', 255)->nullable();
            $table->string('schema_location', 255)->nullable();
            $table->json('estructura')->nullable();
            $table->json('validaciones')->nullable();
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
        Schema::dropIfExists('xml_plantillas');
    }
};
