<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Registro congelado al emitir/expedir documento DEC.
 *
 * periodo*: periodo curricular institucional (interno).
 * etiqueta*: solo referencia/display; la SEP/DEC usa el número/semestre acordados, no parseamos etiqueta como entero.
 * semestre: valor entero destinado al atributo DEC/XML (DEC “semestre”) resuelto y fijado al generar este snapshot (no debe recalcularse con cambios posteriores al mapper catálogo).
 * periodo: ciclo cursado institucional (p. ej. clave ciclo escolar o etiqueta tipo 2020-2021), distinto del periodo curricular flexible.
 */
class DocumentoMateriaSnapshot extends Model
{
    protected $table = 'documento_materias_snapshot';

    protected $fillable = [
        'documento_academico_id',
        'materia_cursada_id',
        'clave',
        'nombre',
        'calificacion_final',
        'tipo_periodo_curricular',
        'numero_periodo_curricular',
        'etiqueta_periodo_curricular',
        'semestre',
        'periodo',
        'creditos',
        'orden',
        'metadata',
    ];

    protected $casts = [
        'calificacion_final' => 'decimal:2',
        'numero_periodo_curricular' => 'integer',
        'semestre' => 'integer',
        'creditos' => 'integer',
        'orden' => 'integer',
        'metadata' => 'array',
    ];

    public function documentoAcademico(): BelongsTo
    {
        return $this->belongsTo(DocumentoAcademico::class);
    }

    public function materiaCursada(): BelongsTo
    {
        return $this->belongsTo(MateriaCursada::class);
    }
}
