# 04 — Base de datos y relaciones

## Resumen

- **72 migraciones** en `database/migrations/`
- Motor recomendado producción: **MySQL**
- ORM: **Eloquent** con FKs, enums y JSON en documentos

## Tabla central: `documentos_academicos`

| Campo | Tipo | Notas |
|-------|------|-------|
| `alumno_id` | FK | Obligatorio |
| `matricula_id` | FK nullable | |
| `oferta_academica_id` | FK nullable | Programa/plan vía oferta |
| `ciclo_escolar_id` | FK | |
| `subsistema_id` | FK nullable | Normal vs UPN |
| `institucion_id`, `sede_id`, `region_id` | FK nullable | Alcance institucional |
| `tipo_documento` | enum | certificado, titulo, grado |
| `tipo_certificacion` | string | total, parcial, etc. |
| `estado_workflow` | enum | borrador → en_revision → aprobado / rechazado |
| `estado_cadena` | enum | Cadena original |
| `estado_xml` | enum | XML DEC |
| `estado_firma` | enum | SEP/SINCE |
| `estado_pdf` | enum | Generación PDF |
| `folio_interno`, `folio_digital_sep` | string | Únicos SEP |
| `metadata`, `snapshot_json` | JSON | Trayectoria, promedios, flags |
| `softDeletes` | | Borrado lógico |

**Índices:** por workflow, subsistema+ciclo, institución+sede, folio.

## Cadena de catálogo institucional

```
subsistemas (NORMAL, UPN)
    └── regiones
            └── instituciones
                    └── sedes (CCT)
                            └── ofertas_academicas
                                    ├── programas_estudio
                                    ├── planes_estudio
                                    └── ciclos_escolares
```

## Alumno y trayectoria

```
alumnos
  └── matriculas (única activa por política reciente)
  └── materias_cursadas
  └── trayectorias_academicas
  └── solicitudes_matricula
```

## Tablas satélite del documento

| Tabla | Relación |
|-------|----------|
| `documento_versiones` | Versiones PDF/XML |
| `documento_payloads` | Payload DEC |
| `documento_observaciones` | Observaciones institucionales |
| `documento_estados_historial` | Timeline estados |
| `documento_firmas` | Intentos firma SEP |
| `documento_firmantes` | Firmantes |
| `documento_materias_snapshot` | Materias al emitir |
| `folios` | Folios internos |
| `cadena_original_generadas` | Cadena timbrada |
| `url_short_tokens` | Consulta pública |

## RBAC (Spatie)

- `roles`, `permissions`
- `model_has_roles`, `model_has_permissions`
- `role_has_permissions`

Guard: `web` (usuarios API también).

## Menús

- `menus` — árbol (parent_id), `route`, `permission_name`, `roles` JSON
- `menu_role`, `menu_permission` — pivots

Seed: `SystemMenusSeeder.php`.

## Alcance multi-institución

| Tabla | Uso |
|-------|-----|
| `usuario_regiones` | Filtra regiones del usuario |
| `usuario_instituciones` | Instituciones asignadas |
| `usuario_sedes` | Sedes asignadas |

Aplicado en servicios de catálogo y bandejas vía `alcance` policies.

## Auditoría e integraciones

- `activity_log` — Spatie
- `auditoria_eventos` — eventos negocio
- `integraciones_logs` — llamadas Informix/SINCE/sync
- `telescope_entries` — solo desarrollo

## Consultas típicas (bandeja)

El servicio `BandejaDocumentoAcademicoService`:

1. Filtra por slug de bandeja → `estado_workflow` / `estado_firma` / flags metadata
2. Aplica alcance usuario (institución/sede)
3. Aplica filtros request (`subsistema`, `q`, fechas…)
4. Eager load: `alumno`, `matricula`, `institucion`, `sede`, `ofertaAcademica.programa`

**Riesgo N+1:** revisar `with()` en cada método de bandeja antes de producción con volumen alto.

## Escalabilidad BD

| Recomendación | Motivo |
|---------------|--------|
| Índices compuestos según reportes reales | Bandejas por institución+ciclo |
| Archivar documentos firmados por ciclo | Tabla principal crece rápido |
| No consultar JSON en WHERE sin columna generada | `metadata` es flexible pero lento |
| Colas para PDF/firma | Evitar transacciones largas |

## Siguiente lectura

- [modelo-academico-control-escolar.md](./modelo-academico-control-escolar.md)
- [02 - Backend, API y modelos](./02-backend-api-modelos.md)
