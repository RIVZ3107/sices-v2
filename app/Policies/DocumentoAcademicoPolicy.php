<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Support\SicesAuth;

class DocumentoAcademicoPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function viewAny(User $user): bool
    {
        return SicesAuth::canAny($user, 'ver_documentos', 'documentos.ver');
    }

    public function view(User $user, DocumentoAcademico $documento): bool
    {
        if (! SicesAuth::canAny($user, 'ver_documentos', 'documentos.ver')) {
            return false;
        }

        if (! $this->alcance->documentoEnAlcance($user, $documento)) {
            return false;
        }

        if ($user->hasRole('auditor') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            return true;
        }

        if (SicesAuth::canAny($user, 'aprobar_documentos', 'documentos.aprobar', 'documentos.aprobar_institucionalmente')
            || SicesAuth::canAny($user, 'crear_documentos', 'documentos.crear', 'documentos.crear_borrador')) {
            return true;
        }

        if ($user->hasRole('sistemas')
            && ! SicesAuth::canAny($user, 'aprobar_documentos', 'documentos.aprobar', 'documentos.aprobar_institucionalmente')
            && ! SicesAuth::canAny($user, 'crear_documentos', 'documentos.crear', 'documentos.crear_borrador')) {
            return $documento->estado_workflow === EstadoWorkflow::APROBADO->value;
        }

        if ($user->hasRole('consulta') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            return $documento->estado_workflow === EstadoWorkflow::APROBADO->value;
        }

        return true;
    }

    public function create(User $user): bool
    {
        if (! SicesAuth::canAny($user, 'crear_documentos', 'documentos.crear', 'documentos.crear_borrador')) {
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
        return SicesAuth::canAny($user, 'editar_documentos', 'documentos.editar')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function pasarPendiente(User $user, DocumentoAcademico $documento): bool
    {
        return $this->update($user, $documento);
    }

    public function enviarRevision(User $user, DocumentoAcademico $documento): bool
    {
        return SicesAuth::canAny($user, 'enviar_revision', 'documentos.enviar_revision')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function aprobar(User $user, DocumentoAcademico $documento): bool
    {
        return (SicesAuth::canAny(
            $user,
            'aprobar_documentos',
            'documentos.aprobar',
            'documentos.aprobar_institucionalmente',
        )
            || $user->can('validaciones_normativas.aprobar')
            || $user->can('certificacion.autorizar_emision')
            || $user->can('certificacion.validar'))
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function rechazar(User $user, DocumentoAcademico $documento): bool
    {
        return (SicesAuth::canAny(
            $user,
            'rechazar_documentos',
            'documentos.rechazar',
            'documentos.rechazar_institucionalmente',
        )
            || $user->can('validaciones_normativas.rechazar'))
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function cancelar(User $user, DocumentoAcademico $documento): bool
    {
        return SicesAuth::canAny($user, 'cancelar_documentos', 'documentos.cancelar')
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function asignarFolioInterno(User $user, DocumentoAcademico $documento): bool
    {
        return (SicesAuth::canAny($user, 'preparar_documento_firma', 'folios.asignar')
                || $user->can('certificacion.autorizar_emision')
                || $user->can('documentos.liberar_proceso_tecnico'))
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function emitirTokenConsultaPublica(User $user, DocumentoAcademico $documento): bool
    {
        if ($user->hasRole('control_escolar_escuela') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            return false;
        }

        return (SicesAuth::canAny(
            $user,
            'consulta_publica.emitir_token',
            'consulta_publica.configurar',
            'preparar_documento_firma',
            'documentos.liberar_proceso_tecnico',
            'certificacion.autorizar_emision',
        ))
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function marcarListoParaFirma(User $user, DocumentoAcademico $documento): bool
    {
        return (SicesAuth::canAny(
            $user,
            'preparar_documento_firma',
            'documentos.liberar_proceso_tecnico',
            'certificacion.enviar_a_proceso_tecnico',
        ))
            && $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function firmar(User $user, DocumentoAcademico $documento): bool
    {
        if ($user->hasRole('responsable_certificacion_titulacion') && ! $user->hasAnyRole(['superadmin', 'admin'])) {
            return false;
        }

        if (! SicesAuth::canAny($user, 'firma.ejecutar')) {
            return false;
        }

        return $this->alcance->documentoEnAlcance($user, $documento);
    }

    public function generarCadena(User $user, DocumentoAcademico $documento): bool
    {
        if (! SicesAuth::canAny($user, 'generar_cadena', 'cadena_original.generar')) {
            return false;
        }

        return $this->view($user, $documento);
    }

    public function generarXml(User $user, DocumentoAcademico $documento): bool
    {
        if (! SicesAuth::canAny($user, 'generar_xml', 'xml.generar')) {
            return false;
        }

        return $this->view($user, $documento);
    }
}
