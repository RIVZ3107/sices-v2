<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportacionHistoricaMaterias extends Model
{
    protected $table = 'importaciones_materias_historicas';

    protected $fillable = [
        'user_id',
        'matricula_id',
        'ciclo_escolar_id',
        'estado',
        'filas_payload',
        'validacion_payload',
        'reconciliacion_payload',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'filas_payload' => 'array',
            'validacion_payload' => 'array',
            'reconciliacion_payload' => 'array',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }
}
