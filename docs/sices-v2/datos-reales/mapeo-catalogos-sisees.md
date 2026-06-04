# Mapeo catálogos SISEES → SICES v2

## Seguridad

- Conexión Laravel: `mysql_sisees_legacy` (`SICEES_LEGACY_*`).
- Solo `127.0.0.1` / `sisees_legacy` (nunca BD `sisees` de producción).
- Solo `SELECT` en legacy; escritura en SICES v2 solo con `--confirm`.

## Tablas legacy (dump confirmado)

| Clave config | Tabla MySQL |
|--------------|-------------|
| `institucion` | `institucion` |
| `oferta_educativa` | `oferta_educativa` |
| `programa_estudios` | `programa_estudios` |
| `plan_estudios` | `plan_estudios` |
| `materia` | `materia` |
| `periodo_programa_estudios` | `periodo_programa_estudios` |
| `materia_periodo` | `materia_periodo` |
| `programa_estudios_institucion` | `programa_estudios_institucion` |
| `modalidad` | `modalidad` |
| `turno` | `turno` |

No se usan tablas `e11*`.

## Entidades SICES v2

| Entidad | Origen |
|---------|--------|
| `instituciones` | `institucion` con `tipo_institucion = 1` |
| `sedes` | `institucion` con `tipo_institucion = 2` o `institucion_id` padre |
| `niveles_academicos` | `oferta_educativa.nombre_oferta_educativa` |
| `programas_estudio` | `programa_estudios` + nivel vía `oferta_educativa_id` |
| `planes_estudio` | `plan_estudios` (solo si `programa_estudios_id` existe y es importable) |
| `materias` | `materia` catálogo maestro (activas; no requieren `plan_materias`) |
| `plan_materias` | `materia_periodo` + `periodo_programa_estudios` |
| `ofertas_academicas` | `programa_estudios_institucion` × planes del programa |

## Metadata

Cada registro importado incluye `metadata.legacy_sisees_id` y `metadata.legacy_sisees_tabla`.

`status` (bit) → `activo` boolean en SICES v2.

## Preflight: planes huérfanos

En el dump real, `programa_estudios` tiene IDs **1–37** (36 activos, 1 inactivo). Los `plan_estudios` activos con `programa_estudios_id` **≥ 38** son **huérfanos reales** (el programa no existe en legacy). No se importan ni se inventan programas padre; motivo `programa_no_resuelto`. La importación continúa con los planes válidos (~31).

## Comando

```bash
php artisan sices:importar-catalogos-sisees --dry-run
php artisan sices:importar-catalogos-sisees --confirm
```

Reportes: `storage/app/reportes/importacion-sisees/` (JSON/MD con `preflight`, `omitidos_por_motivo`).
