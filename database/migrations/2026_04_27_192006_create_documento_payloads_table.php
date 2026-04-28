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
        Schema::create('documento_payloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            $table->enum('tipo', ['CERTIFICADO_XML', 'CERTIFICADO_PDF', 'TITULO_XML', 'TITULO_PDF', 'GRADO_XML', 'GRADO_PDF']);
            $table->unsignedInteger('version')->default(1);
            $table->json('payload_json');
            $table->string('payload_hash', 128);
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['documento_academico_id', 'tipo', 'version'], 'documento_payloads_doc_tipo_version_unq');
            $table->index(['documento_academico_id', 'tipo']);
            $table->index('payload_hash');
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documento_payloads');
    }
};
