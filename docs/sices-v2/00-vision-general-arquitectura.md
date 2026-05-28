# 00 — Visión general y arquitectura

## Qué es SICES v2

**SICES v2** (Control Escolar para Educación Superior) es una aplicación web para:

- Gestionar **catálogo institucional** (subsistemas Normal/UPN, instituciones, sedes, programas, planes).
- Operar **control escolar** (alumnos, matrículas, trayectoria, documentos).
- Ejecutar el **workflow de certificación** académica hacia SEP (revisión, folios, cadena, XML, firma).
- Supervisar desde **Educación Superior** y dictaminar desde **Responsable de Certificación**.
- Correr el **proceso técnico** (firma SINCE, legacy Informix) desde el rol **Sistemas**.

No es solo un CRUD: el núcleo es el **documento académico** (`documentos_academicos`) con estados paralelos (workflow, cadena, XML, firma, PDF).

## Capas del sistema

```
┌─────────────────────────────────────────────────────────┐
│  Navegador — React 19 SPA (Vite)                        │
│  router.jsx · layouts · pages · api/*.js                │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS  /api/v1/*
                            │ Bearer token (Sanctum)
┌───────────────────────────▼─────────────────────────────┐
│  Laravel 13 — API REST                                  │
│  Middleware: auth:sanctum, permission_or                │
│  Controllers → Services → Models → MySQL                │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   MySQL SICES        MySQL Control      Informix SICES
   (principal)        Escolar (sync)     (legacy/shadow)
                            │
                            ▼
                    SINCE / SEP (firma, consulta)
```

## Tipos de “cliente”

| Cliente | Entrada | Auth |
|---------|---------|------|
| Usuario institucional | `/login` → `/app/*` | Sanctum PAT + permisos Spatie |
| Consulta pública | URL con token documento | Sin login (token opaco) |
| Integraciones | Jobs / servicios internos | Config `.env` + flags `*_ENABLED` |

## Módulos funcionales (vista de negocio)

| Módulo | Rol principal | Prefijo UI |
|--------|---------------|------------|
| Dashboard por rol | Todos | `/app/dashboard` |
| Control escolar | `control_escolar_escuela` | `/app/control-escolar/*` |
| Dirección escuela | `director_escuela` | `/app/direccion/*` |
| Educación Superior | `educacion_superior` | `/app/educacion-superior/*` |
| Certificación RC | `responsable_certificacion_titulacion` | `/app/certificacion/*` |
| Sistemas / técnico | `sistemas` | `/app/sistemas/*` |
| Admin | `admin`, `superadmin` | `/app/admin/*` |
| Documentos transversales | Varios | `/app/documentos/*` |

## Principios de diseño que debes conocer

1. **Permisos, no `roles[0]` en UI** — El frontend usa `user.permissions[]` vía `userCanAny()`.
2. **Menús en base de datos** — Lo que ves en el sidebar sale de `GET /api/v1/me/menus`, seedeado con `SystemMenusSeeder`.
3. **Firma SEP solo en Sistemas** — ES y RC liberan a “proceso técnico”; no ejecutan `firma.ejecutar` en su UI.
4. **Subsistemas** — Normal y UPN comparten motor de documentos; se filtran por `subsistema_id` / `subsistema=UPN`.
5. **Integraciones apagadas por defecto** — Informix, SINCE y control escolar externo requieren `.env` explícito.

## Siguiente lectura

- [01 - Stack tecnológico](./01-stack-tecnologico.md)
- [08 - Flujos de certificación](./08-flujos-certificacion.md)
- [diagnostico-rbac-roles-permisos-certificacion.md](./diagnostico-rbac-roles-permisos-certificacion.md) (detalle RBAC)
