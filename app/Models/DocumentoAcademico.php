<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentoAcademico extends Model
{
    use SoftDeletes;

    protected $table = 'documentos_academicos';

    protected $fillable = [
        'alumno_id',
        'matricula_id',
        'oferta_academica_id',
        'ciclo_escolar_id',
        'subsistema_id',
        'region_id',
        'institucion_id',
        'sede_id',
        'tipo_documento',
        'tipo_certificacion',
        'folio_interno',
        'folio_digital_sep',
        'token_consulta_publica',
        'estado_workflow',
        'estado_cadena',
        'estado_xml',
        'estado_firma',
        'estado_sep',
        'estado_pdf',
        'fecha_solicitud',
        'fecha_aprobacion',
        'fecha_firma',
        'fecha_pdf',
        'snapshot_json',
        'metadata',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'fecha_solicitud' => 'datetime',
        'fecha_aprobacion' => 'datetime',
        'fecha_firma' => 'datetime',
        'fecha_pdf' => 'datetime',
        'snapshot_json' => 'array',
        'metadata' => 'array',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function ofertaAcademica(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function folio(): HasOne
    {
        return $this->hasOne(Folio::class);
    }

    public function urlShortToken(): HasOne
    {
        return $this->hasOne(UrlShortToken::class);
    }

    public function payloads(): HasMany
    {
        return $this->hasMany(DocumentoPayload::class);
    }

    public function cadenasOriginales(): HasMany
    {
        return $this->hasMany(CadenaOriginalGenerada::class);
    }

    public function versiones(): HasMany
    {
        return $this->hasMany(DocumentoVersion::class);
    }

    public function firmantes(): HasMany
    {
        return $this->hasMany(DocumentoFirmante::class);
    }

    public function firmas(): HasMany
    {
        return $this->hasMany(DocumentoFirma::class);
    }

    public function materiasSnapshot(): HasMany
    {
        return $this->hasMany(DocumentoMateriaSnapshot::class);
    }

    public function integracionesLogs(): HasMany
    {
        return $this->hasMany(IntegracionLog::class);
    }

    public function estadosHistorial(): HasMany
    {
        return $this->hasMany(DocumentoEstadoHistorial::class);
    }

    public function observaciones(): HasMany
    {
        return $this->hasMany(DocumentoObservacion::class);
    }

    public function observacionesPendientes(): HasMany
    {
        return $this->hasMany(DocumentoObservacion::class)->where('estado', 'pendiente');
    }

    public function ultimaObservacion(): HasOne
    {
        return $this->hasOne(DocumentoObservacion::class)->latestOfMany();
    }
}
