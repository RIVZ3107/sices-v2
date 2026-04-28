<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;

class DocumentoAcademicoPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function viewAny(User $user): bool
    {
        return $user->can('ver_documentos');
    }

    public function view(User $user, DocumentoAcademico $documento): bool
    {
        if (! $user->can('ver_documentos')) {
            return false;
        }

        if (! $this->alcance->documentoEnAlcance($user, $documento)) {
            return false;
        }

        if ($user->can('aprobar_documentos') || $user->can('crear_documentos')) {
            return true;
        }

        if ($user->hasRole('sistemas') && ! $user->can('aprobar_documentos') && ! $user->can('crear_documentos')) {
            return $documento->estado_workflow === EstadoWorkflow::APROBADO->value;
        }

        if ($user->hasRole('consulta') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            return $documento->estado_workflow === EstadoWorkflow::APROBADO->value;
        }

        return true;
    }

    public function create(User $user): bool
    {
        if (! $user->can('crear_documentos')) {
            return false;
        }

        if ($user->hasRole('sistemas') && ! $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            return false;
        }

        return true;
    }

    public function validar(User $user, DocumentoAcademico $documento): bool
    {
        return $this->view($user, $documento);
    }

    public function update(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('editar_documentos')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function pasarPendiente(User $user, DocumentoAcademico $documento): bool
    {
        return $this->update($user, $documento);
    }

    public function enviarRevision(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('enviar_revision')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function aprobar(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('aprobar_documentos')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function rechazar(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('rechazar_documentos')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function cancelar(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('cancelar_documentos')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function asignarFolioInterno(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('preparar_documento_firma')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function emitirTokenConsultaPublica(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('preparar_documento_firma')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function marcarListoParaFirma(User $user, DocumentoAcademico $documento): bool
    {
        return $user->can('preparar_documento_firma')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }
}
