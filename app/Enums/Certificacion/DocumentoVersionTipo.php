<?php

namespace App\Enums\Certificacion;

enum DocumentoVersionTipo: string
{
    case XML_DEC_LOCAL = 'XML_DEC_LOCAL';
    case XML_DEC_FIRMADO_RESPONSABLE = 'XML_DEC_FIRMADO_RESPONSABLE';
    case XML_DEC_TIMBRADO_SEP = 'XML_DEC_TIMBRADO_SEP';
    case PDF_OFICIAL = 'PDF_OFICIAL';
    case PDF_REGENERADO = 'PDF_REGENERADO';
    case PAYLOAD_DEC = 'PAYLOAD_DEC';
    case CADENA_ORIGINAL_DEC = 'CADENA_ORIGINAL_DEC';
}
