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
        Schema::create('documento_estados_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->constrained('documentos_academicos')->restrictOnDelete();
            $table->enum('campo', ['estado_workflow', 'estado_cadena', 'estado_xml', 'estado_firma', 'estado_pdf']);
            $table->string('estado_anterior', 50)->nullable();
            $table->string('estado_nuevo', 50);
            $table->text('motivo')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['documento_academico_id', 'campo']);
            $table->index('estado_nuevo');
            $table->index('changed_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documento_estados_historial');
    }
};
