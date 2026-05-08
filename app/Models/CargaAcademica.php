<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CargaAcademica extends Model
{
    protected $table = 'cargas_academicas';

    protected $fillable = [
        'inscripcion_periodo_id',
        'plan_materia_id',
        'materia_id',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function inscripcionPeriodo(): BelongsTo
    {
        return $this->belongsTo(InscripcionPeriodo::class);
    }

    public function planMateria(): BelongsTo
    {
        return $this->belongsTo(PlanMateria::class);
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class);
    }

    public function materiasCursadas(): HasMany
    {
        return $this->hasMany(MateriaCursada::class);
    }
}
