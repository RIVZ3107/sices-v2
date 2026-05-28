# 05 — Matriz de roles, permisos y menús

## Cómo se integran roles y menús (seeders)

Orden en `DatabaseSeeder`:

1. Catálogos base (subsistemas, municipios, motor documento…)
2. **`RolesAndPermissionsSeeder`** — crea permisos desde `SicesPermissionsCatalog` y asigna por rol
3. **`SystemMenusSeeder`** — crea ítems de menú y los liga a roles
4. Demo usuarios (solo si **no** es `production`)

### Archivos clave

| Archivo | Función |
|---------|---------|
| `database/seeders/Support/SicesPermissionsCatalog.php` | Catálogo maestro de permisos (legacy + modular) |
| `database/seeders/RolesAndPermissionsSeeder.php` | Crea roles y `syncPermissions` |
| `database/seeders/SystemMenusSeeder.php` | Menú lateral por rol |
| `resources/js/layouts/SidebarPro.jsx` | Consume `GET /api/v1/me/menus` |

**Importante:** Si cambias el seeder pero no re-ejecutas, la BD sigue con menús viejos (“Dashboard” vs “Supervisión de certificación”). Comando:

```bash
php artisan db:seed --class=SystemMenusSeeder
```

Luego **cerrar sesión y volver a entrar** (o refrescar token).

## Roles del sistema (14)

| Rol técnico | Nombre en UI | Inicio típico |
|-------------|--------------|---------------|
| `superadmin` | Superadmin | `/app/superadmin/dashboard` |
| `admin` | Administrador | `/app/admin/dashboard` |
| `sistemas` | Sistemas | `/app/sistemas/proceso-tecnico-certificacion` |
| `educacion_superior` | Educación Superior | `/app/educacion-superior/certificacion` |
| `director_escuela` | Dirección de Escuela | `/app/dashboard` → dirección |
| `control_escolar_escuela` | Control Escolar | `/app/dashboard` → CE |
| `responsable_certificacion_titulacion` | Certificación / titulación | `/app/certificacion/dashboard` |
| `responsable_admision` | Responsable admisión | `/app/dashboard` |
| `responsable_evaluacion` | Responsable evaluación | `/app/coordinador/dashboard` |
| `docente` | Docente | `/app/docente/dashboard` |
| `coordinador_academico` | Coordinador | `/app/coordinador/dashboard` |
| `auditor` | Auditor | `/app/auditoria` |
| `consulta` | Consulta | `/app/consulta` |
| `alumno_egresado` | Alumno / egresado | Dashboard alumno |
| `aspirante_preinscrito` | Aspirante | Dashboard aspirante |

`superadmin` y `admin` reciben **todos** los permisos del catálogo.

## Matriz de responsabilidades

| Rol | Responsabilidades | No debe |
|-----|-------------------|---------|
| **Control escolar** | Captura alumnos, matrícula, borradores certificado, enviar a revisión | Firmar SEP, dictamen institucional final |
| **Educación Superior** | Supervisión institucional, catálogos ES, validaciones normativas, UPN, revisión expediente | Layout RC duplicado; firma SEP |
| **Responsable certificación** | Dictamen, revisión institucional, folios, liberar a proceso técnico | Generar cadena/XML/firma (salvo permiso técnico explícito) |
| **Sistemas** | Cadena, XML, preflight, firma SINCE, shadow Informix, logs | Operación escolar día a día |
| **Dirección** | Indicadores, supervisión (lectura) | Matrícula operativa |
| **Admin** | Usuarios, roles, menús, parámetros | — |

## Menú Educación Superior (referencia seeder)

| Sección | Ítem | Ruta |
|---------|------|------|
| MAIN | Supervisión de certificación | `/app/educacion-superior/certificacion` |
| OPERACION | Instituciones, Sedes, Programas, Planes | `/app/educacion-superior/...` |
| OPERACION | Validaciones normativas | `/app/educacion-superior/validaciones-normativas` |
| OPERACION | Certificación UPN | `/app/educacion-superior/upn/certificacion` |
| OPERACION | Revisión por expediente | `/app/educacion-superior/revision` |
| CONSULTA | Consulta pública | `/app/consulta/documentos` |

## Menú Responsable Certificación

Bajo padre `Certificación` (`#`):

- Solicitudes, Documentos a certificar, Generación, Firma (seguimiento), Entrega, **Revisión institucional**, Reportes, Notificaciones

Ruta revisión RC: `/app/certificacion/revision`

## Permisos en frontend (ejemplos UPN)

Archivo: `resources/js/utils/upnCertificacionPermissions.js`

| Acción UI | Permisos aceptados |
|-----------|-------------------|
| Ver | `documentos.ver`, `certificacion.ver` |
| Aprobar | `documentos.aprobar`, `certificacion.validar`, … |
| Rechazar | `documentos.rechazar`, … |
| Observar | `observaciones.crear` |
| Liberar proceso técnico | `documentos.liberar_proceso_tecnico`, … |
| PDF | `pdf.ver` |
| Legacy SEP | `sices_legacy.consultar` |

**Prohibido en UI UPN:** `firma.ejecutar`, `generar_cadena`, `xml.generar`, export Informix.

## Nomenclatura dual de permisos

En rutas API verás:

```
permission_or:ver_documentos|documentos.ver|certificacion.ver
```

- **Legacy:** `ver_documentos`, `ver_alumnos`
- **Modular:** `documentos.ver`, `alumnos.ver`

El catálogo mantiene paridad; al crear permisos nuevos usar **modular** y actualizar `SicesPermissionsCatalog`.

## Prioridad de rol en dashboard

`DashboardPage.jsx` y backend `DashboardRoleResolver` comparten orden:

```
superadmin → admin → sistemas → educacion_superior → director_escuela
→ control_escolar_escuela → … → aspirante
```

Si un usuario tiene varios roles, gana el primero en esa lista.

## Siguiente lectura

- [diagnostico-rbac-roles-permisos-certificacion.md](./diagnostico-rbac-roles-permisos-certificacion.md) (auditoría RBAC completa)
- [08 - Flujos de certificación](./08-flujos-certificacion.md)
