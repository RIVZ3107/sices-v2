<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visual_dataset_events', function (Blueprint $table): void {
            $table->id();
            $table->string('bucket', 64)->index();
            $table->string('estado', 32)->index();
            $table->string('summary', 255);
            $table->text('detail')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visual_dataset_events');
    }
};
