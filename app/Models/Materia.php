<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Materia extends Model
{
    use SoftDeletes;

    protected $table = 'materias';

    protected $fillable = [
        'plan_estudio_id',
        'clave',
        'nombre',
        'creditos',
        'semestre',
        'orden',
        'tipo',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'creditos' => 'integer',
        'semestre' => 'integer',
        'orden' => 'integer',
        'metadata' => 'array',
    ];

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class);
    }

    public function materiasCursadas(): HasMany
    {
        return $this->hasMany(MateriaCursada::class);
    }

    public function planMaterias(): HasMany
    {
        return $this->hasMany(PlanMateria::class);
    }
}
