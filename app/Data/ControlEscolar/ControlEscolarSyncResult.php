<?php

declare(strict_types=1);

namespace App\Data\ControlEscolar;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\Matricula;

final readonly class ControlEscolarSyncResult
{
    /**
     * @param  list<string>  $warnings
     * @param  list<string>  $differences
     */
    public function __construct(
        public bool $success,
        public string $message,
        public ?Alumno $alumno = null,
        public ?Matricula $matricula = null,
        public ?DocumentoAcademico $documento = null,
        public int $materiasImportadas = 0,
        public bool $createdAlumno = false,
        public bool $createdMatricula = false,
        public bool $skippedFrozenDocument = false,
        public array $warnings = [],
        public array $differences = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'alumno_id' => $this->alumno?->id,
            'matricula_id' => $this->matricula?->id,
            'documento_id' => $this->documento?->id,
            'materias_importadas' => $this->materiasImportadas,
            'created_alumno' => $this->createdAlumno,
            'created_matricula' => $this->createdMatricula,
            'skipped_frozen_document' => $this->skippedFrozenDocument,
            'warnings' => $this->warnings,
            'differences' => $this->differences,
        ];
    }
}
