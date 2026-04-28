<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function regiones(): BelongsToMany
    {
        return $this->belongsToMany(Region::class, 'usuario_regiones')
            ->withPivot('metadata')
            ->withTimestamps();
    }

    public function instituciones(): BelongsToMany
    {
        return $this->belongsToMany(Institucion::class, 'usuario_instituciones')
            ->withPivot('metadata')
            ->withTimestamps();
    }

    public function sedes(): BelongsToMany
    {
        return $this->belongsToMany(Sede::class, 'usuario_sedes')
            ->withPivot('metadata')
            ->withTimestamps();
    }

    public function documentosCreados(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class, 'created_by');
    }

    public function documentosAprobados(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class, 'approved_by');
    }

    public function auditoriaEventos(): HasMany
    {
        return $this->hasMany(AuditoriaEvento::class);
    }
}
