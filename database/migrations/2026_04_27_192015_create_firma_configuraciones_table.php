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
        Schema::create('firma_configuraciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('nivel_academico_id')->nullable()->constrained('niveles_academicos')->nullOnDelete();
            $table->enum('tipo_documento', ['certificado', 'titulo', 'grado']);
            $table->enum('proveedor', ['SEP_SINCE_SERVICE', 'SIMULADO', 'OTRO'])->default('SIMULADO');
            $table->string('endpoint', 255)->nullable();
            $table->string('metodo', 10)->default('POST');
            $table->unsignedInteger('timeout')->default(30);
            $table->boolean('requiere_xml_previo')->default(true);
            $table->boolean('requiere_cadena_original')->default(true);
            $table->boolean('requiere_sello_local')->default(false);
            $table->boolean('requiere_firmante')->default(true);
            $table->string('version_firma', 50)->nullable();
            $table->json('headers')->nullable();
            $table->json('parametros')->nullable();
            $table->json('metadata')->nullable();
            $table->enum('estatus', ['activa', 'inactiva', 'pruebas'])->default('activa');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['subsistema_id', 'tipo_documento']);
            $table->index(['institucion_id', 'tipo_documento']);
            $table->index(['nivel_academico_id', 'tipo_documento']);
            $table->index(['proveedor', 'estatus']);
            $table->index('estatus');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firma_configuraciones');
    }
};
