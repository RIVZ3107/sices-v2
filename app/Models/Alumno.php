<?php

namespace App\Models;

use App\Services\Certificacion\IdentificadorAlumnoService;
use App\Services\Certificacion\ValidacionSimultaneidadAcademicaService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Alumno extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::saving(function (Alumno $model): void {
            app(IdentificadorAlumnoService::class)->aplicarAlModelo($model);
        });
    }

    protected $fillable = [
        'curp',
        'nombre',
        'primer_apellido',
        'segundo_apellido',
        'fecha_nacimiento',
        'genero',
        'nacionalidad',
        'estatus',
        'rfc',
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

    public function solicitudesMatricula(): HasMany
    {
        return $this->hasMany(SolicitudMatricula::class);
    }

    /**
     * Compatibilidad legacy: ahora apunta a la matrícula activa, no a matrícula única vitalicia.
     */
    public function matricula(): HasOne
    {
        return $this->matriculaActiva();
    }

    public function matriculaActiva(): HasOne
    {
        $activos = app(ValidacionSimultaneidadAcademicaService::class)->estadosMatriculaActivos();

        return $this->hasOne(Matricula::class)->whereIn('estado', $activos)->latestOfMany();
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
