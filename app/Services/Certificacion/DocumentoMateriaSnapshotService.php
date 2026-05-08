<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\MateriaCursada;
use App\Support\Certificacion\PeriodoCurricularDecMapper;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentoMateriaSnapshotService
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @return array{total:int, created:bool}
     */
    public function generarSiNoExiste(DocumentoAcademico $documento, ?int $actorId = null): array
    {
        $documento->loadMissing('materiasSnapshot');
        if ($documento->materiasSnapshot->isNotEmpty()) {
            return ['total' => $documento->materiasSnapshot->count(), 'created' => false];
        }

        return $this->forzarRegeneracion($documento, $actorId);
    }

    /**
     * @return array{total:int, created:bool}
     */
    public function forzarRegeneracion(DocumentoAcademico $documento, ?int $actorId = null): array
    {
        if ($documento->matricula_id === null) {
            throw ValidationException::withMessages([
                'matricula_id' => ['El documento no tiene matrícula asociada para generar snapshot de materias.'],
            ]);
        }

        $materias = MateriaCursada::query()
            ->where('matricula_id', $documento->matricula_id)
            ->with('planMateria')
            ->orderBy('tipo_periodo_curricular')
            ->orderBy('numero_periodo_curricular')
            ->orderBy('semestre')
            ->orderBy('clave')
            ->orderBy('id')
            ->get();

        if ($materias->isEmpty()) {
            throw ValidationException::withMessages([
                'materias' => ['No se puede generar snapshot: la matrícula no tiene materias cursadas.'],
            ]);
        }

        $total = DB::transaction(function () use ($documento, $materias, $actorId): int {
            DocumentoMateriaSnapshot::query()
                ->where('documento_academico_id', $documento->id)
                ->delete();

            $orden = 1;
            foreach ($materias as $materia) {
                $semestreDec = PeriodoCurricularDecMapper::semestreDecParaMateriaCursada($materia);
                if ($semestreDec === null) {
                    throw ValidationException::withMessages([
                        'materias' => [
                            'No hay mapeo DEC claro (atributo semestre XML) para la materia cursada '.$materia->clave
                            .'; corrija `semestre` / plan o revisión institucional sin inferencias automáticas.',
                        ],
                    ]);
                }

                $tipoInt = PeriodoCurricularDecMapper::normalizarTipo($materia->tipo_periodo_curricular ?? 'semestre');

                DocumentoMateriaSnapshot::query()->create([
                    'documento_academico_id' => $documento->id,
                    'materia_cursada_id' => $materia->id,
                    'clave' => $materia->clave,
                    'nombre' => $materia->nombre,
                    'calificacion_final' => $materia->calificacion_final ?? $materia->calificacion,
                    'tipo_periodo_curricular' => $tipoInt,
                    'numero_periodo_curricular' => $materia->numero_periodo_curricular,
                    'etiqueta_periodo_curricular' => $materia->etiqueta_periodo_curricular,
                    'semestre' => $semestreDec,
                    'periodo' => $materia->periodo,
                    'creditos' => $materia->creditos,
                    'orden' => $materia->orden ?? $orden++,
                    'metadata' => [
                        'estado_materia' => $materia->estado,
                        'calificacion_texto' => $materia->calificacion_texto,
                        'congelacion' => [
                            'semestre_dec_xml' => $semestreDec,
                            'periodo_cursado' => $materia->periodo,
                            'tipo_periodo_curricular' => $tipoInt,
                            'numero_periodo_curricular' => $materia->numero_periodo_curricular,
                            'generado_en' => now()->toIso8601String(),
                        ],
                    ],
                ]);
            }

            $count = DocumentoMateriaSnapshot::query()
                ->where('documento_academico_id', $documento->id)
                ->count();

            $this->auditoria->registrar(
                'documento_materias_snapshot.generado',
                DocumentoAcademico::class,
                $documento->id,
                ['total_materias' => $count],
                $actorId,
            );

            return $count;
        });

        return ['total' => $total, 'created' => true];
    }
}
