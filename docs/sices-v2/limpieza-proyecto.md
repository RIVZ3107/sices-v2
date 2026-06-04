# Limpieza de proyecto — SICES v2

Auditoría de archivos demo/desarrollo tras la limpieza de base de datos (mayo 2026).

## Comandos Artisan recomendados (vigentes)

| Comando | Uso |
|---------|-----|
| `php artisan sices:auditar-datos` | Solo lectura: conteos demo |
| `php artisan sices:limpiar-demo --dry-run` | Simulación borrado lógico |
| `php artisan sices:limpiar-demo --confirm` | Soft delete de registros demo activos |
| `php artisan sices:limpiar-demo --confirm --purge-soft-deleted` | Purga física de filas demo con `deleted_at` |
| `php artisan sices:diagnosticar-base` | Diagnóstico de estructura y catálogos (MD + JSON en `storage/app/reportes/`) |

## Comandos deprecated (no flujo recomendado)

| Comando | Reemplazo / nota |
|---------|------------------|
| `sices:reset-demo-control-escolar` | `sices:limpiar-demo --confirm` |
| `sices:seed-dataset-visual-roles` | Datos reales vía importadores |
| `sices:reset-dataset-visual-roles` | Solo desarrollo de tableros visuales |

## Archivos eliminados

| Archivo | Razón |
|---------|--------|
| `database/seeders/CertificacionControlEscolarDemoSeeder.php` | Alias duplicado; canónico en `Demo\` |
| `database/seeders/DemoUsuariosPorRolSeeder.php` | Alias duplicado; canónico en `Demo\` |
| `database/seeders/RoleMenuSeeder.php` | No-op sin referencias; menús en `SystemMenusSeeder` |

## Archivos conservados (aislados demo)

| Ruta | Motivo |
|------|--------|
| `database/seeders/Demo/*` | Seeders demo; `ALLOW_DEMO_SEEDERS=true` |
| `database/seeders/Base/InstitutionalBaseSeeder.php` | Catálogos base para `DatabaseSeeder` |
| `database/seeders/Concerns/GuardsDemoSeeders.php` | Protección ENV |
| `app/Services/Demo/*` | Limpieza y purga demo |
| `app/Support/Demo/*` | Criterios y scope demo |
| `app/Services/ControlEscolar/ResetDemoControlEscolarService.php` | Motor de reset usado por `limpiar-demo` |
| `app/Services/Diagnostico/*` | Diagnóstico de base |
| `tests/Feature/Seeders/DemoDataIsolationTest.php` | Regresión limpieza demo |
| `tests/Feature/Diagnostico/DiagnosticoBaseCommandTest.php` | Regresión diagnóstico |
| `tests/Feature/Certificacion/ControlEscolarDemoSeederTest.php` | Regresión seeder demo (import actualizado a `Demo\`) |

## Archivos deprecated (mantenidos por compatibilidad)

| Archivo | Nota |
|---------|------|
| `database/seeders/MenuSeeder.php` | Delega a `SystemMenusSeeder` |
| `app/Console/Commands/ResetDemoControlEscolarCommand.php` | Delega a `DemoDataCleanupService`; aviso en consola |

## DatabaseSeeder

Solo ejecuta:

1. `InstitutionalBaseSeeder` (roles, permisos, menús, catálogos, configuración)
2. `DemoBundleSeeder` **si** `ALLOW_DEMO_SEEDERS=true` y no es `production`

## Frontend / React (auditado, conservado)

| Área | Resultado |
|------|-----------|
| `certificadorUx.js`, `certificadorBandeja.js` | En uso en bandeja/detalle certificador |
| `solicitudDocumentalUx.js` | En uso en flujo Control Escolar |
| `CertificadorDocumentoDetalle`, `CertificadorBandejaActions` | Rutas `/app/documentos/:id`, `/app/certificacion/documentos-a-certificar` |
| Helpers `@deprecated` (`certificacionNav.js`, `upnCertificacion.js`) | Mantenidos por compatibilidad; sin eliminar |

No se detectaron componentes React huérfanos creados solo para demo en esta pasada.

## Tests (conservados)

| Suite | Motivo |
|-------|--------|
| `tests/Feature/Seeders/DemoDataIsolationTest.php` | Limpieza demo + purge |
| `tests/Feature/Diagnostico/DiagnosticoBaseCommandTest.php` | Diagnóstico base |
| `tests/Feature/Certificacion/*Workflow*`, `*Roles*`, `*Bandeja*` | Workflow institucional |
| `tests/Feature/Menus/SystemMenusIntegrityTest.php` | Menús |
| `tests/Feature/Dashboard/DatasetVisualRolesTest.php` | Dataset visual (deprecated, no eliminado) |

## Intencionalmente no tocado

- Firma, XML, PDF, Informix, Jasper, jobs, migraciones destructivas
- `SinceFirmaTestCommand`, `SicesLegacyHealthCommand` (otros dominios)

## Generados en runtime (ignorados por git)

- `storage/app/reportes/diagnostico-base/*.md`
- `storage/app/reportes/diagnostico-base/*.json`

## Validación realizada (sin tests)

- `npm run build`
- `php artisan route:list`
- `php artisan list` (comandos `sices:*`)

**No se ejecutó** `php artisan test` ni PHPUnit/Pest, conforme a la solicitud.

## Próximo paso operativo

1. `php artisan sices:diagnosticar-base`
2. Cargar datos reales según `docs/sices-v2/datos-reales/importacion-controlada.md`
3. Mantener `ALLOW_DEMO_SEEDERS=false` en `.env` de trabajo serio
