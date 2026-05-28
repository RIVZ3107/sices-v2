# 07 — UX/UI, diseño y código redundante

## Situación actual del diseño

El frontend tiene **varias capas visuales coexistiendo**:

| Capa | Estilo | Dónde |
|------|--------|-------|
| App shell global | Topbar + sidebar oscuro (`admin-*`) | `AppLayout`, `SidebarPro` |
| Institucional | Cards blancas, `inst-*` | Bandejas documentos, `FilterBar` |
| Certificación RC | Sidebar morado/oscuro cert | `CertificacionLayout`, `certificacion.css` |
| Educación Superior | Métricas azules, inline styles | `EsPageLayout`, `esTheme.js` |
| Control escolar | Similar ES | `CePageLayout`, `ceTheme.js` |

**Síntoma:** el usuario percibe “dos diseños” (shell global vs contenido del módulo).

**Mitigación aplicada (ES):** clase `admin-layout--es`, sin breadcrumb duplicado, `EsLoadingState` unificado.

## Mapa de layouts por ruta

| Ruta | Layout |
|------|--------|
| `/login` | `AuthLayout` |
| `/app/certificacion/*` | `AppLayout` → `CertificacionLayout` |
| `/app/educacion-superior/*` | `AppLayout` → `EsPageLayout` (sin CertificacionLayout) |
| `/app/control-escolar/*` | `AppLayout` → `CePageLayout` |
| `/app/documentos/*` | `AppLayout` → páginas con `PageHeader` + `inst-*` |

## Usabilidad — fortalezas y debilidades

| Aspecto | Estado |
|---------|--------|
| Menú por rol | Bueno — dinámico desde API |
| Permisos en botones | Bueno — `upnCan`, `esCan`, guards |
| Bandejas con filtros | Mejorado — toolbar colapsable, debounce |
| Carga inicial ES/UPN | Mejorado — timeout, menos bandejas paralelas |
| Feedback error | Mejorado — Reintentar, empty states |
| Consistencia visual | Pendiente — unificar tokens |
| Mobile | Limitado — tablas anchas |

## Código y archivos redundantes

### Alta prioridad (confunde mantenimiento)

| Elemento | Problema | Acción sugerida |
|----------|----------|-----------------|
| `components/` vs `components/ui/` | Duplicados FormField, EmptyState… | Migrar imports a `ui/` |
| `layouts/Sidebar.jsx` | No usado | Eliminar o archivar |
| `Api/Certificacion/*` controllers | Sin rutas | Eliminar stubs |
| 8 páginas `admision/*` | Sin router | Cablear o borrar |
| ~10 páginas `sistemas/*` | Sin router | Cablear o borrar |

### Media prioridad

| Elemento | Problema |
|----------|----------|
| 3 dashboards superadmin | Varios archivos SuperAdmin* |
| `CertificationStatusBadge` vs `CertificacionStatusBadge` | Naming duplicado |
| `useCertificacionSupervision` | 5–7 fetches — necesita API agregada |
| 18 servicios `Dashboard/*` | Patrón repetitivo por rol |
| Permisos legacy + modular en cada ruta | Mantenimiento doble |

### Baja prioridad

| Elemento | Notas |
|----------|-------|
| `data/*DemoData.js` | OK para prototipos CE/dirección |
| Servicios `@deprecated` | Alias hasta migración completa |

## Rutas duplicadas con propósito

| Pantalla | Rutas | Motivo |
|----------|-------|--------|
| Revisión institucional | `/app/certificacion/revision` y `/app/educacion-superior/revision` | Mismo componente, distinto shell por rol |
| Supervisión vs RC certificación | ES certificación vs RC módulo | Subsistemas y permisos distintos |

Helper: `resources/js/utils/certificacionRoutes.js`

## Estilos — qué archivo tocar

| Quieres cambiar… | Archivo |
|------------------|---------|
| Sidebar global | `sices-ui.css`, `SidebarPro` |
| Bandejas institucionales | `sices-institucional.css` |
| Módulo RC | `certificacion.css`, `certTheme.js` |
| Módulo ES | `esTheme.js`, clase `es-page-root` |
| Tema colores logo | API apariencia + `SicesThemeProvider` |

## Plan de consolidación UI (recomendado)

1. **Fase 1:** Unificar `components/ui` como única fuente de FormField, Empty, Error, Loading.
2. **Fase 2:** Tokens CSS compartidos (`--sices-primary`, spacing) en `sices-ui.css`.
3. **Fase 3:** Un layout `ModulePageLayout` parametrizable (reemplaza Es/Ce parcialmente).
4. **Fase 4:** Eliminar páginas huérfanas y `Sidebar.jsx`.

## Siguiente lectura

- [03 - Frontend React](./03-frontend-react.md)
- [ux-control-escolar-certificacion.md](./ux-control-escolar-certificacion.md)
