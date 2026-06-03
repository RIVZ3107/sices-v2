# Seeders SICES v2

## Clasificación

| Carpeta / clase | Tipo | Descripción |
|-----------------|------|-------------|
| `Base/InstitutionalBaseSeeder` | Base institucional | Ejecutado por `DatabaseSeeder` |
| `Catalogos/*` | Catálogos oficiales | Instituciones, sedes legacy |
| `EntidadFederativaSeeder`, `MunicipioSeeder`, `SubsistemasSeeder`, … | Catálogos | Geografía, subsistemas, tipos documentales |
| `RolesAndPermissionsSeeder`, `SystemMenusSeeder` | Menús / RBAC | Roles, permisos, menús |
| `Demo/*` | Demo / desarrollo | Requiere `ALLOW_DEMO_SEEDERS=true` |
| `MenuSeeder`, `RoleMenuSeeder` | Deprecated | Alias o no-op; usar `SystemMenusSeeder` |
| `sices:seed-dataset-visual-roles` (comando) | Testing visual | Dataset semirreal; no productivo |

## Uso

```bash
# Base limpia (sin alumnos demo)
php artisan db:seed

# Base + demo (solo local/testing)
ALLOW_DEMO_SEEDERS=true php artisan db:seed

# Solo paquete demo
ALLOW_DEMO_SEEDERS=true php artisan db:seed --class=Database\\Seeders\\Demo\\DemoBundleSeeder
```
