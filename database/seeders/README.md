# Seeders SICES v2

## Clasificación

| Carpeta / clase | Tipo | Descripción |
|-----------------|------|-------------|
| `Base/InstitutionalBaseSeeder` | Base institucional | Ejecutado por `DatabaseSeeder` |
| `Catalogos/*` | Catálogos oficiales | Instituciones, sedes legacy |
| `EntidadFederativaSeeder`, `MunicipioSeeder`, `SubsistemasSeeder`, … | Catálogos | Geografía, subsistemas, tipos documentales |
| `RolesAndPermissionsSeeder`, `SystemMenusSeeder` | Menús / RBAC | Roles, permisos, menús |

## Uso

```bash
# Base institucional (roles, permisos, menús, catálogos)
php artisan db:seed

# Seeders puntuales
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=SystemMenusSeeder
```

## Limpieza de datos demo en BD

No hay seeders demo en el repositorio. Use los comandos Artisan:

```bash
php artisan sices:auditar-datos
php artisan sices:limpiar-demo --dry-run
php artisan sices:diagnosticar-base
```

Ver `docs/sices-v2/datos-reales/importacion-controlada.md`.
