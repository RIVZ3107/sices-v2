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
        Schema::create('cadena_original_generadas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            // `documento_payloads` se crea en una migración posterior.
            $table->unsignedBigInteger('documento_payload_id');
            $table->foreignId('cadena_original_regla_id')->constrained('cadena_original_reglas')->restrictOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->string('payload_hash', 64);
            $table->longText('cadena_original');
            $table->string('cadena_hash', 64);
            $table->enum('estado', ['generada', 'error_cadena', 'invalidada'])->default('generada');
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['documento_academico_id', 'version']);
            $table->index('documento_academico_id');
            $table->index('documento_payload_id');
            $table->index('cadena_original_regla_id');
            $table->index('payload_hash');
            $table->index('cadena_hash');
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cadena_original_generadas');
    }
};
