# Plan de implementación DEC Normal 2025 (SICES v2)

Fecha: 2026-05-06

## Qué se corrigió en esta iteración

- Se resolvieron conflictos Git en capa de captura de alumno:
  - `StoreAlumnoCapturaRequest`
  - `AlumnoCapturaController`
- Se reforzó regla institucional de matrícula única:
  - comando `php artisan sices:detectar-matriculas-duplicadas`
  - migración con `UNIQUE(matriculas.alumno_id)` y validación previa de duplicados
- Se agregó estado SEP independiente:
  - enum `EstadoSep`
  - columna `estado_sep` en `documentos_academicos`
  - soporte en estado/historial/model/resource
- Se implementó snapshot congelado de materias:
  - tabla `documento_materias_snapshot`
  - servicio `DocumentoMateriaSnapshotService`
  - generación al aprobar y al preparar documento
- Se formalizó versionado DEC en `documento_versiones`:
  - tipos DEC nuevos
  - `spec_code`, `spec_version`, `generado_por`, `generado_en`
- Se creó base técnica DEC Normal 2024-2025 en modo controlado:
  - spec + payload builder + validador + cadena builder + xml builder

## Qué queda pendiente

- Integrar cadena/XML DEC en workflow productivo completo (orquestación end-to-end).
- Ajustar catálogos normativos faltantes (entidad/municipio/CCT/modalidad oficial).
- Endurecer validaciones de contenido contra artefactos oficiales finales (XSD/XSLT validados).
- Completar cobertura de pruebas feature para endpoints DEC.

## Qué no se implementó aún (intencionalmente)

- Firma SEP real / timbrado productivo.
- Endpoints productivos externos y secretos.
- Flujo UPN específico sin especificación cerrada.
- Reingeniería completa de título/grado.

## Qué falta para firma real SEP

- Contrato técnico oficial de integración (payload, respuesta, errores, SLA).
- Gestión segura de credenciales/certificados por ambiente.
- Cliente real con retries, idempotencia fuerte y observabilidad.
- Validación criptográfica real y reglas de negocio de reintento/cancelación.

## Qué falta para UPN

- Confirmación normativa de si comparte o no DEC Normal.
- Definición de `spec_code`/XSD/cadena para UPN.
- Builders y pruebas UPN dedicadas.

## Qué falta para título y grado

- Especificación oficial por tipo documental.
- Builders de payload/cadena/XML específicos.
- Flujo de firma y estados por tipo.
- Pruebas funcionales completas y artefactos de referencia.

## Siguiente orden recomendado

1. Cerrar catálogos normativos y mapeos de campos oficiales.
2. Validar cadena/XML DEC con ejemplos oficiales y pruebas de conformidad.
3. Integrar orquestación DEC en servicios/controladores con bandera de feature.
4. Preparar integración SEP real solo cuando esté firmado el contrato técnico.
