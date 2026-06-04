# Seeders deprecated

| Clase | Reemplazo |
|-------|-----------|
| `Database\Seeders\MenuSeeder` | `SystemMenusSeeder` |
| `Database\Seeders\CertificacionControlEscolarDemoSeeder` (eliminado) | `Database\Seeders\Demo\CertificacionControlEscolarDemoSeeder` |
| `Database\Seeders\DemoUsuariosPorRolSeeder` (eliminado) | `Database\Seeders\Demo\DemoUsuariosPorRolSeeder` |

Los seeders demo viven en `database/seeders/Demo/` y requieren `ALLOW_DEMO_SEEDERS=true`.
