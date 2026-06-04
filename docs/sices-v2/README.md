# Documentación SICES v2



Guía para operación institucional: Laravel, React, MySQL, APIs, roles, certificación e importación de datos reales.



## Por dónde empezar



| Si quieres… | Lee primero |

|-------------|-------------|

| Panorama del sistema y capas | [00 - Visión general y arquitectura](./00-vision-general-arquitectura.md) |

| Qué tecnologías usa el proyecto | [01 - Stack tecnológico](./01-stack-tecnologico.md) |

| APIs, controladores, modelos, servicios | [02 - Backend, API y modelos](./02-backend-api-modelos.md) |

| React, rutas, componentes, hooks | [03 - Frontend React](./03-frontend-react.md) |

| Tablas, relaciones, migraciones | [04 - Base de datos](./04-base-datos-relaciones.md) |

| Roles, permisos, menús (seeders) | [05 - Matriz de roles y menús](./05-roles-menus-matriz.md) |

| Claves `.env`, Sanctum, Informix, firma SEP | [06 - Seguridad e integraciones](./06-seguridad-integraciones.md) |

| Flujo certificación Normal / UPN / Sistemas | [08 - Flujos de certificación](./08-flujos-certificacion.md) |

| Checklist producción y diagnóstico | [09 - Diagnóstico y go-live](./09-diagnostico-go-live.md) |

| **Importación y limpieza de datos** | [datos-reales/importacion-controlada.md](./datos-reales/importacion-controlada.md) |
| **Catálogos SISEES → SICES v2** | [datos-reales/mapeo-catalogos-sisees.md](./datos-reales/mapeo-catalogos-sisees.md) |



## Documentos de referencia



| Archivo | Tema |

|---------|------|

| [diagnostico-rbac-roles-permisos-certificacion.md](./diagnostico-rbac-roles-permisos-certificacion.md) | RBAC detallado |

| [modelo-academico-control-escolar.md](./modelo-academico-control-escolar.md) | Modelo académico CE |

| [ux-control-escolar-certificacion.md](./ux-control-escolar-certificacion.md) | UX control escolar ↔ certificación |

| [plan-implementacion-dec-normal-2025.md](./plan-implementacion-dec-normal-2025.md) | DEC-Normal 2025 |

| [importacion-historica-ejemplos-payload.md](./importacion-historica-ejemplos-payload.md) | Importación histórica |



## Código de referencia rápida



| Área | Ruta |

|------|------|

| Rutas API | `routes/api.php` |

| Router SPA | `resources/js/router.jsx` |

| Menús por rol | `database/seeders/SystemMenusSeeder.php` |

| Permisos | `database/seeders/Support/SicesPermissionsCatalog.php` |

| Bandejas certificación | `app/Services/Certificacion/BandejaDocumentoAcademicoService.php` |

| Limpieza demo | `app/Services/Demo/DemoDataCleanupService.php` |



## Comandos operativos



```bash

php artisan db:seed

php artisan sices:diagnosticar-base

php artisan sices:auditar-datos

php artisan sices:limpiar-demo --dry-run

php artisan sices:importar-catalogos-sisees --dry-run

npm run build

```



---



*Última actualización: junio 2026 — proyecto listo para catálogos e importación real.*

