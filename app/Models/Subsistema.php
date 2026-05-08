<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subsistema extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'clave',
        'nombre',
        'nombre_corto',
        'descripcion',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function instituciones(): HasMany
    {
        return $this->hasMany(Institucion::class);
    }

    public function regiones(): HasMany
    {
        return $this->hasMany(Region::class);
    }

    public function firmaConfiguraciones(): HasMany
    {
        return $this->hasMany(FirmaConfiguracion::class);
    }

    public function cadenaOriginalReglas(): HasMany
    {
        return $this->hasMany(CadenaOriginalRegla::class);
    }

    public function xmlPlantillas(): HasMany
    {
        return $this->hasMany(XmlPlantilla::class);
    }

    public function plantillasDocumentos(): HasMany
    {
        return $this->hasMany(PlantillaDocumento::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }

    public function programasEstudio(): HasMany
    {
        return $this->hasMany(ProgramaEstudio::class);
    }

    public function planesEstudio(): HasMany
    {
        return $this->hasMany(PlanEstudio::class);
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }
}
