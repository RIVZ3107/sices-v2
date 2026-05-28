# Documentación SICES v2

Guía para entender el sistema completo: Laravel, React, MySQL, APIs, roles, UX y operación con datos reales.

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
| Diseño UI, duplicados, deuda visual | [07 - UX/UI y redundancias](./07-ux-ui-redundancias.md) |
| Flujo certificación Normal / UPN / Sistemas | [08 - Flujos de certificación](./08-flujos-certificacion.md) |
| Checklist producción y diagnóstico | [09 - Diagnóstico y go-live](./09-diagnostico-go-live.md) |

## Documentos que ya existían en el repo

| Archivo | Tema |
|---------|------|
| [diagnostico-rbac-roles-permisos-certificacion.md](./diagnostico-rbac-roles-permisos-certificacion.md) | RBAC detallado (roles, permisos, rutas) |
| [modelo-academico-control-escolar.md](./modelo-academico-control-escolar.md) | Modelo académico CE |
| [ux-control-escolar-certificacion.md](./ux-control-escolar-certificacion.md) | UX control escolar ↔ certificación |
| [plan-implementacion-dec-normal-2025.md](./plan-implementacion-dec-normal-2025.md) | DEC-Normal 2025 |
| [auditoria-sices-v2-contra-legacy-certificacion.md](./auditoria-sices-v2-contra-legacy-certificacion.md) | Comparación legacy |
| [importacion-historica-ejemplos-payload.md](./importacion-historica-ejemplos-payload.md) | Importación histórica |

## Código de referencia rápida

| Área | Ruta |
|------|------|
| Rutas API | `routes/api.php` |
| Router SPA | `resources/js/router.jsx` |
| Menús por rol | `database/seeders/SystemMenusSeeder.php` |
| Permisos | `database/seeders/Support/SicesPermissionsCatalog.php` |
| Bandejas certificación | `app/Services/Certificacion/BandejaDocumentoAcademicoService.php` |
| Cliente HTTP front | `resources/js/api/client.js` |
| Permisos en UI | `resources/js/utils/userPermissions.js` |

## Comandos útiles

```bash
# Menús y permisos en BD
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=SystemMenusSeeder

# Tests menús / UPN
php artisan test tests/Feature/Menus/
php artisan test tests/Feature/EducacionSuperior/UpnCertificacionBandejaTest.php

# Frontend producción
npm run build
```

---

*Última actualización de esta guía: mayo 2026 — alineada al estado del repositorio sices-v2.*
