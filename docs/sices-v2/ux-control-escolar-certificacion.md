# UX Control Escolar y certificación (SICES v2)

Fecha: 2026-05-06

Documento de principios de interfaz para captura académica, expediente consolidado, importación histórica y solicitud de certificación. Complementa `modelo-academico-control-escolar.md`.

## Principios generales

1. **Flujos guiados** — Pantallas tipo asistente o pasos cortos (`StepWizard`, importación histórica) en lugar de formularios monolíticos.
2. **Sin ruido técnico para el usuario** — No exponer IDs de base de datos, nombres de columnas (`plan_materia_id`), claves internas ni slugs de permisos salvo soporte nivel 2/trazabilidad en bitácora técnica.
3. **Textos institucionales** — Ciclo escolar, oferta/plan vigente en catálogo, matrícula “clave institucional”, concordancia con plan de estudios.
4. **Estado derivado visible** — Badges de validación (`certificacionStatus.js`), resúmenes legibles desde `GET .../resumen-institucional`, alertas ante divergencias de plan y normativa legacy.
5. **No alterar SEP** — Flujos de firma y catálogos oficiales se respetan; la UI orienta y valida, no sustituye reglas SEP.

## Pantallas y rutas (SPA)

| Ruta | Uso |
|------|-----|
| `/app/alumnos` | Búsqueda; acciones **360°**, captura guiada y certificación por fila. |
| `/app/alumnos/:id/expediente` | **Alumno 360**: resumen, vida académica, trayectoria/certificación con pestañas. |
| `/app/alumnos/captura-guiado` · `/app/alumnos/:id/captura-guiado` | Mapa operativo del flujo institucional. |
| `/app/alumnos/:id/trayectoria` | Trayectoria contextualizada desde expediente (misma herramienta que `/app/trayectorias` con alumno fijado). |
| `/app/materias-cursadas` | Carga desde plan/plantilla donde aplique; campos bloqueados con `LockedField` / badges de plan. |
| `/app/importaciones` | Importación histórica: pasos, prevalidación, conciliación, confirmación con bloqueos. |
| `/app/certificacion/solicitud` | Solicitud de certificado (total/parcial) con contexto alumno cuando venga por query. |

## Orientación por rol (menú lateral)

- **Control escolar**: alumnos, captura guiada, matrículas, materias/calificaciones, trayectoria, importaciones, solicitud de certificación, observaciones SEP y documentos de captura/consulta.
- **Director de escuela**: bandejas de documentos por etapa — pendientes, en revisión, aprobados, rechazados y listos para firma SEP.
- **Educación superior**: revisión pendiente/validación, consulta alumno/trayectoria, normativa legacy, aprobados/observados, listos para firma donde corresponda.
- **Sistemas / Auditor**: vistas técnicas o de auditoría; importaciones pueden figurar como soporte lectura donde se definió política institucional.

## Campos editables vs bloqueados

- **Preferir catálogo y plan**: clave oficial de materia, nombre oficial y créditos suelen derivarse del `plan_materias` cuando hay concordancia; la UI lo comunica como “coincide con el plan / catálogo”.
- **Calificación y periodo**: según reglas de negocio vigentes; si el backend fija bloqueo, reflejar con `ReadOnlyField` o mensaje claro, no con error crudo.
- **Importación histórica**: filas conciliadas no deben mostrar IDs técnicos; mensaje de conciliación en lenguaje natural.

## Importación histórica — confirmación

No habilitar **Confirmar importación** cuando:

- Hay **duplicados locales** de clave en el pegado/surtido de filas.
- No existe **informe de prevalidación** cargado en el cliente.
- `tiene_bloqueos` del informe es verdadero y no se activó **forzar sin plan** con el flujo institucional completo.
- Hay filas **sin concordancia en el plan** y no se activó **forzar sin plan** con motivo (mín. 20 caracteres) y acuse cuando corresponda.

En **forzar sin plan**, el botón permanece deshabilitado hasta motivo y acuse válidos.

## Lenguaje de errores y avisos

- Preferir: “Resuelva duplicados en el archivo”, “Alinee las filas con el plan o active forzar con motivo institucional”, “Solicite el permiso institucional al administrador” (evitar nombres de policies en UI).
- Separar **advertencia** (puede continuar con acuse) de **bloqueo** (no confirmar sin acción correctiva).

## Utilidades front

- `resources/js/utils/certificacionStatus.js` — Estados legibles para badges y mensajes.
- Componentes en `resources/js/components/academic/*` — Resúmenes, pasos, campos bloqueados, modales de confirmación.

## Referencias API (sin cambiar contratos)

- Resumen institucional: `GET /api/v1/certificacion/alumnos/{alumno}/resumen-institucional` (objeto `refs` para POST internos de la SPA).
- Trayectoria por matrícula y recálculo: rutas bajo certificación/académico según implementación actual.
- Importaciones: namespace `academico/importaciones` existente; no duplicar endpoints.
