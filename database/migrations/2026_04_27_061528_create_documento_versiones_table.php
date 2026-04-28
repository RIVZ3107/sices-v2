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
        Schema::create('documento_versiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            // `documento_payloads` se crea en una migración posterior.
            $table->unsignedBigInteger('documento_payload_id')->nullable();
            $table->foreignId('cadena_original_generada_id')->nullable()->constrained('cadena_original_generadas')->nullOnDelete();
            $table->enum('tipo', ['XML_ORIGINAL', 'XML_SELLADO', 'XML_FIRMADO_SEP', 'PDF_OFICIAL', 'QR', 'EVIDENCIA']);
            $table->unsignedInteger('version')->default(1);
            $table->longText('contenido')->nullable();
            $table->string('storage_disk', 80)->nullable();
            $table->string('storage_path', 255)->nullable();
            $table->string('sha256', 64)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->boolean('activo')->default(true);
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['documento_academico_id', 'tipo', 'version'], 'documento_versiones_doc_tipo_version_unq');
            $table->index(['documento_academico_id', 'tipo']);
            $table->index('documento_payload_id');
            $table->index('cadena_original_generada_id');
            $table->index('sha256');
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documento_versiones');
    }
};
