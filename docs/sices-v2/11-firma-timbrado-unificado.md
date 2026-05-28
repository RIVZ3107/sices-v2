# Firma y timbrado unificado (SICES v2)

## Orquestador

`DocumentoFirmaUnificadoService` resuelve el **canal** según subsistema y tipo documental, delega al handler correspondiente y, tras éxito, asegura **token de consulta pública** (`UrlShortTokenService`).

| Canal | Condición | Implementación |
|-------|-----------|----------------|
| `normal_certificado_sep` | Subsistema ≠ UPN, tipo `certificado` | `LegacySinceSigningBridgeService` (servicio 34) |
| `upn_firma_local` | Subsistema `UPN` | `UpnFirmaLocalService` (sello local + PDF) |
| `titulo_sep` | Tipo `titulo` | `SinceTitulosFirmaClient` |
| `grado_sep` | Tipo `grado` | `SinceTitulosFirmaClient` (endpoint grado) |

API: `POST /api/v1/certificacion/documentos-academicos/{id}/firma/ejecutar`  
Permiso: `firma.ejecutar` + policy `firmar`.

## Variables de entorno

```env
# Servicio 34 (normales)
SINCE_FIRMA_ENABLED=true
SINCE_FIRMA_SIMULATED=false

# since-títulos (título / grado)
SINCE_TITULOS_ENABLED=true
SINCE_TITULOS_SIMULATED=false
SINCE_TITULOS_TITULO_PROD_URL=...
SINCE_TITULOS_GRADO_PROD_URL=...

# UPN firma local
SICES_UPN_FIRMA_LOCAL_ENABLED=true
SICES_UPN_GENERAR_PDF_TRAS_FIRMA=true
```

## Auditoría

Eventos: `firma_canal_resuelto`, `firma_intento`, `firma_ok`, `firma_fallo`, `consulta_publica_token_emitido`.

Registros en `documento_firmas` con `proveedor`: `SEP_SINCE_SERVICE`, `SEP_SINCE_TITULOS`, `UPN_FIRMA_LOCAL`.

## JSON export hacia legacy (cadena / XML / timbrado)

`GET /api/v1/certificacion/documentos-academicos/{id}/legacy-timbrado-json`

Devuelve `e11superior_cert` y `e11materias_cert` con nombres de campo del legacy PHP:

| Bloque | Campos |
|--------|--------|
| `e11superior_cert` | `nombre`, `primerApellido`, `segundoApellido`, `curp`, `odigitoCurp`, `claveInstitucion`, `cct`, `nombreEscuela`, `idEntidad`, `municipio`, `claveCarrera`, `carrera`, `planEstudios`, `tipoCertificado` (T/P), `fechaExpedicion`, `promedio` |
| `e11materias_cert[]` | `clave_materia`, `nombre_materia`, `calificacionFinal_materia`, `semestre_materia`, `periodo` |

El shadow export a Informix reutiliza el mismo mapeo vía `LegacyCertificadoTimbradoJsonService`.
