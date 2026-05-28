# 02 — Backend, API y modelos

## Autenticación API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Email/password → token Bearer |
| GET | `/api/v1/auth/me` | Usuario + roles + permissions |
| POST | `/api/v1/auth/logout` | Revoca token actual |

**Guard:** Sanctum Personal Access Token.  
**Autorización:** Spatie `permission` / middleware custom `permission_or:perm1|perm2`.

## Grupos de API (`routes/api.php`)

### Certificación — `v1/certificacion` (~75 rutas)

| Subgrupo | Ejemplos | Servicio / controlador |
|----------|----------|------------------------|
| Catálogos | `catalogos/instituciones`, `sedes`, `programas` | `CatalogoCapturaController` |
| Alumnos / matrículas | CRUD académico | Varios V1 |
| Documentos | crear, enviar revisión, aprobar, rechazar | `DocumentoAcademicoController` |
| Bandejas | `bandejas/documentos-academicos/{bandeja}` | `BandejaDocumentoAcademicoController` |
| Observaciones | crear, atender | Observaciones |
| DEC-Normal | pipeline XML 2025 | `DecNormal2025*` services |
| Firma | preflight, ejecutar (con permisos técnicos) | `DocumentoFirmaController` |
| PDF | generar, ver estado | Servicios PDF/Jasper |

**Bandejas disponibles (slug en URL):**

`en-revision`, `pendientes-revision`, `aprobados`, `rechazados`, `listos-para-firma`, `firmados`, `errores-firma`, `cancelados`, `borradores`, etc.

**Filtros comunes en query:**

- `subsistema=UPN` o `subsistema_id`
- `institucion_id`, `sede_id`, `ciclo_escolar_id`
- `q`, `curp`, `folio_interno`, `fecha_desde`, `fecha_hasta`

### Control escolar — `v1/control-escolar`

Dashboard, alumnos, expedientes, inscripciones, integración sync (`ControlEscolarIntegracionController`).

### Educación superior — `v1/educacion-superior`

Métricas agregadas, reportes oficiales.

### Admin — `v1/admin`

Usuarios, roles, menús (`MenuAdminController`).

### Menús usuario — `v1/me/menus`

Árbol de menú filtrado por rol y permisos del usuario.

### SICES legacy — `v1/sices-legacy`

Consulta/shadow Informix (solo con permisos y flags habilitados).

### Consulta pública — `v1/consulta-publica/documentos/{token}`

**Sin autenticación** — validación por token del documento.

## Formato JSON típico

### Listado (bandeja)

```json
{
  "data": [ { "id": 1, "folio_interno": "...", "estado_workflow": "en_revision", "alumno": { } } ],
  "meta": { "current_page": 1, "per_page": 40, "total": 120 }
}
```

Resource principal: `App\Http\Resources\Certificacion\BandejaDocumentoAcademicoResource`.

### Error API

El cliente Axios normaliza en `resources/js/api/client.js`:

- 403 → mensaje de permisos
- 422 → validación
- 500 → error genérico

## Modelos Eloquent (52) — mapa por dominio

### Institucional
`Subsistema`, `Region`, `Institucion`, `Sede`, `NivelAcademico`, `ProgramaEstudio`, `PlanEstudio`, `PlanMateria`, `Materia`, `CicloEscolar`, `OfertaAcademica`, `EntidadFederativa`, `Municipio`

### Alumno y trayectoria
`Alumno`, `Matricula`, `SolicitudMatricula`, `TrayectoriaAcademica`, `MateriaCursada`, `InscripcionPeriodo`, `CargaAcademica`, `PeriodoEscolar`, `Grupo`, `Generacion`, `ImportacionHistoricaMaterias`

### Documento académico (núcleo)
`DocumentoAcademico`, `DocumentoVersion`, `DocumentoPayload`, `DocumentoObservacion`, `DocumentoEstadoHistorial`, `DocumentoFirma`, `DocumentoFirmante`, `DocumentoMateriaSnapshot`, `Folio`, `UrlShortToken`, `CadenaOriginalGenerada`, `CadenaOriginalRegla`, `PlantillaDocumento`, `XmlPlantilla`

### Firma y sistema
`FirmaConfiguracion`, `CredencialFirma`, `FirmanteAutorizado`, `User`, `Menu`, `ConfiguracionVisualSistema`, `IntegracionLog`, `AuditoriaEvento`, `UsuarioRegion`, `UsuarioInstitucion`, `UsuarioSede`

## Servicios (lógica de negocio)

| Carpeta | Responsabilidad |
|---------|-----------------|
| `Services/Certificacion/` | Workflow, bandejas, folios, PDF, DEC, validaciones |
| `Services/ControlEscolar/` | Operación escuela + sync externo |
| `Services/Dashboard/` | Un servicio por rol (~18) |
| `Services/SicesLegacy/` | Consulta y export shadow |
| `Infrastructure/Since/` | Cliente HTTP firma SEP |
| `Infrastructure/SicesLegacy/` | Repositorios Informix |

## Controladores a ignorar (stubs)

`app/Http/Controllers/Api/Certificacion/*` — **no tienen rutas**. La API viva está en `Api\V1\Certificacion\*`.

## Policies

- `DocumentoAcademicoPolicy`
- `AlumnoPolicy`
- `MatriculaPolicy`
- `ConfiguracionVisualSistemaPolicy`

## Tests Feature relevantes

```
tests/Feature/Menus/
tests/Feature/Certificacion/
tests/Feature/EducacionSuperior/UpnCertificacionBandejaTest.php
tests/Feature/Sistemas/
```

## Siguiente lectura

- [04 - Base de datos](./04-base-datos-relaciones.md)
- [06 - Seguridad e integraciones](./06-seguridad-integraciones.md)
- [diagnostico-rbac-roles-permisos-certificacion.md](./diagnostico-rbac-roles-permisos-certificacion.md)
