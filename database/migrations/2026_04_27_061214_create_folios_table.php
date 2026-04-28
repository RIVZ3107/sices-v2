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
        Schema::create('folios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_academico_id')->nullable()->constrained('documentos_academicos')->nullOnDelete()->unique();
            $table->foreignId('ciclo_escolar_id')->constrained('ciclos_escolares')->restrictOnDelete();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->enum('tipo_documento', ['certificado', 'titulo', 'grado']);
            $table->string('prefijo', 20)->nullable();
            $table->unsignedBigInteger('numero');
            $table->string('folio_completo', 120)->unique();
            $table->enum('estado', ['disponible', 'reservado', 'asignado', 'cancelado'])->default('disponible');
            $table->dateTime('asignado_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['ciclo_escolar_id', 'tipo_documento']);
            $table->index(['subsistema_id', 'tipo_documento']);
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('folios');
    }
};
