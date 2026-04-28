<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Alumno extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'curp',
        'nombre',
        'primer_apellido',
        'segundo_apellido',
        'fecha_nacimiento',
        'genero',
        'nacionalidad',
        'estatus',
        'metadata',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'metadata' => 'array',
    ];

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function materiasCursadas(): HasMany
    {
        return $this->hasMany(MateriaCursada::class);
    }

    public function trayectoriasAcademicas(): HasMany
    {
        return $this->hasMany(TrayectoriaAcademica::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }
}
