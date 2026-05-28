# Vistas clave — módulo certificación (SICES v2)

## Flujo por rol (sin duplicar ejecución técnica)

| Rol | Bandeja / detalle | Firma SEP | Cadena/XML | PDF vista |
|-----|-------------------|-----------|------------|-----------|
| Control Escolar | `/app/documentos/*` | No | No | No |
| Educación Superior / RC | `/app/educacion-superior/revision` o `/app/certificacion/*` | No | No | No |
| Sistemas | `/app/sistemas/proceso-tecnico-certificacion` | **Sí** (`firma.ejecutar`) | **Sí** | Vista previa tras firma |

## Rutas canónicas

- **Institucional:** `DocumentoShowPage` — aprobar, liberar a proceso técnico, enlace a Sistemas.
- **Técnico:** `DocumentoProcesoTecnicoPage` — DEC Normal, shadow Informix, firma servicio 34, vista PDF.
- **Seguimiento RC:** `FirmaElectronicaPage` — solo lectura; no ejecuta firma.
- **Consulta pública:** `GET /api/v1/consulta-publica/documentos/{token}` — sin IDs internos.

## API técnica

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `.../firma/ejecutar` | Firma SEP (solo `firma.ejecutar` + policy) |
| GET | `.../certificado-vista-json` | JSON para plantilla PDF React (documento **firmado**) |
| POST | `.../dec-normal/*` | Pipeline XML local previo a firma |

## Servicio XML → JSON

`CertificadoVistaJsonService`:

1. Exige `estado_firma = firmado` para la vista PDF.
2. Resuelve XML desde `documento_versiones` (prioridad `XML_FIRMADO_SEP`) o Informix (`obtenerXmlSepPorUrlShort`).
3. Parsea con `CertificadoXmlParser` y fusiona snapshots de materias + `JasperPayloadBuilder`.

## Código eliminado (huérfano)

- Stubs `app/Http/Controllers/Api/Certificacion/Documento{Xml,Cadena,Pdf,Workflow,Firma}Controller` (duplicados de V1 vacíos).
- `tests/Feature/Certificacion/FirmaDocumentoAcademicoTest.php` (test Laravel por defecto).
- `resources/js/pages/sistemas/ListosParaFirmaPage.jsx` (reemplazada por proceso técnico).
- Jobs vacíos de certificación y `SelloDocumentoAcademicoService` sin referencias.
