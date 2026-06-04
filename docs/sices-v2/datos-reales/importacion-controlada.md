# Importación controlada de datos reales — SICES v2

## Principio

Los **seeders** cargan únicamente catálogos institucionales base (roles, permisos, menús, subsistemas, instituciones, sedes, tipos documentales, plantillas de configuración, etc.).

Los **datos operativos reales** (alumnos, matrículas, calificaciones, trayectorias, solicitudes documentales) **no** deben generarse con seeders en entornos de trabajo serio.

## Seeders demo (solo local/testing)

| Variable | Valor | Efecto |
|----------|--------|--------|
| `ALLOW_DEMO_SEEDERS` | `true` | Permite `Database\Seeders\Demo\*` y el paquete `DemoBundleSeeder` |

Si `ALLOW_DEMO_SEEDERS` no está activo, cualquier seeder demo aborta con:

> Los seeders demo están deshabilitados. Active ALLOW_DEMO_SEEDERS=true solo en local/testing.

### Estructura de seeders

```
database/seeders/
  Base/              → InstitutionalBaseSeeder (catálogos institucionales)
  Catalogos/         → Instituciones, sedes legacy
  Demo/              → Usuarios @sices.local, expedientes DemoSynthetic
  Concerns/          → GuardsDemoSeeders
  Testing/           → Reservado para fixtures de prueba
```

`DatabaseSeeder` ejecuta solo `InstitutionalBaseSeeder`. El bundle demo corre **únicamente** si `ALLOW_DEMO_SEEDERS=true` y el entorno **no** es `production`.

## Diagnóstico completo de base

Antes de importar datos reales, genere un reporte de solo lectura:

```bash
php artisan sices:diagnosticar-base
```

Salida:

- Consola (resumen de tablas y riesgos)
- `storage/app/reportes/diagnostico-base/diagnostico_base_YYYYMMDD_HHMMSS.md`
- `storage/app/reportes/diagnostico-base/diagnostico_base_YYYYMMDD_HHMMSS.json`

El diagnóstico usa `Schema::hasTable()`, `Schema::hasColumn()` y listados dinámicos; **no asume** columnas como `estatus` o `clave` si no existen.

## Auditoría y limpieza

Comandos de solo lectura / limpieza segura:

```bash
# Auditoría (no borra)
php artisan sices:auditar-datos

# Simulación de borrado
php artisan sices:limpiar-demo --dry-run

# Borrado lógico (soft delete) de registros demo activos
php artisan sices:limpiar-demo --confirm

# Purga física de registros demo ya soft-deleted (no afecta activos ni catálogos reales)
php artisan sices:limpiar-demo --purge-soft-deleted --dry-run
php artisan sices:limpiar-demo --confirm --purge-soft-deleted

# Incluir usuarios @sices.local
php artisan sices:limpiar-demo --confirm --usuarios-demo
php artisan sices:limpiar-demo --confirm --purge-soft-deleted --usuarios-demo
```

En **production** la limpieza está bloqueada salvo `--force-local` (no recomendado).

El comando `sices:reset-demo-control-escolar` está **deprecado**; use `sices:limpiar-demo`.

### Qué no se borra

- Roles, permisos, menús
- Subsistemas, regiones, instituciones y sedes reales
- Municipios y entidades federativas
- Niveles académicos base
- Configuración visual, plantillas institucionales reales
- Registros sin patrón demo claro (`metadata.origen`, `DemoSynthetic`, claves `SXCE-DEMO-*`, etc.)

## Orden recomendado para datos reales

1. Subsistemas (ya en seeders base)
2. Instituciones
3. Sedes
4. Programas de estudio
5. Planes de estudio
6. Ofertas académicas
7. Ciclos escolares reales
8. Alumnos (importador / captura institucional)
9. Matrículas
10. Materias y `plan_materias`
11. Materias cursadas / calificaciones
12. Trayectorias académicas
13. Solicitudes documentales (Control Escolar → workflow institucional)

Cada carga operativa debe usar **importadores o APIs** con validación normativa, trazabilidad y alcance territorial del usuario.

## Patrones demo detectados

- Nombre de alumno: `DemoSynthetic`
- `metadata.origen` = `demo_control_escolar`
- Claves: `SXCE-DEMO-*` (programas, planes, ciclos)
- Correos: `*@sices.local`
- Materias con sufijo `(demo)` o texto sintético en nombre
