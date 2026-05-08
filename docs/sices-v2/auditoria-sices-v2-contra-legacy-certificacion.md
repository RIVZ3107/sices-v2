# Auditoría SICES v2 vs Legacy (Certificación/Firma)

Fecha: 2026-05-06  
Alcance: Laravel 11 + React + MySQL (solo análisis documental, sin cambios de código).

## 0) Fuente base y criterio

- El archivo indicado `docs/sices-v2/levantamiento-pendientes-certificacion-firma.md` **no existe** en este repositorio.
- Se tomó como base el diagnóstico existente: `docs/sices-v2/diagnostico-control-escolar-certificacion.md`.
- Esta auditoría usa evidencia verificable en:
  - `database/migrations`, `app/Models`, `app/Enums`, `app/Services`, `app/Http/*`, `app/Policies`, `app/Jobs`
  - `routes/api.php`, `routes/web.php`
  - `database/seeders`, `tests`
  - `config/certificacion.php`
  - `resources/js/pages`, `resources/js/components`

## 1) Revisión del sistema nuevo SICES v2

### Hallazgos globales

- Sí existe base sólida para flujo **Alumno -> Matrícula -> Materias -> Trayectoria -> Documento**.
- Sí existen estados y orquestación de documento: `estado_workflow`, `estado_cadena`, `estado_xml`, `estado_firma`, `estado_pdf`.
- Sí existen servicios centrales esperados:
  - `DocumentoAcademicoWorkflowService`, `ValidacionAcademicaDocumentoService`, `TrayectoriaAcademicaService`
  - `IdentificadorAlumnoService`, `CadenaOriginalBuilder`, `XmlDocumentoAcademicoBuilder`
  - `OpenSslSelloService`, `SinceFirmaClient`, `FirmarDocumentoAcademicoService`
  - `DocumentStorageService`, `EnsurePdfDocumentoService`, `AuditoriaService`
- No existe evidencia de:
  - `CadenaOriginalDecNormalBuilder`, `XmlDecNormalBuilder`, `QrDocumentoAcademicoService`
  - Builders SEP independientes (`CadenaOriginalSepBuilder`, `SepSelloBuilder`)
  - Builders específicos UPN (`XmlDecUpnBuilder`, `CadenaOriginalDecUpnBuilder`, `UpnDecSpec`)
  - Tabla explícita `documento_xmls`, `documento_pdfs`, `documento_materias_snapshot`, `documento_folios`.
- Hay un punto crítico de calidad: siguen marcadores de conflicto Git en backend:
  - `app/Http/Requests/Certificacion/StoreAlumnoCapturaRequest.php`
  - `app/Http/Controllers/Api/V1/Certificacion/AlumnoCapturaController.php`

## 2) Matriz de existencia real en SICES v2

| Elemento esperado | Existe sí/no | Ruta/archivo encontrado | Estado actual | Brecha | Acción recomendada |
|---|---|---|---|---|---|
| migración alumnos | Sí | `database/migrations/2026_04_27_060923_create_alumnos_table.php` | Operativa | Sin `unique` en `rfc` | Evaluar `unique` en `rfc` si regla institucional lo exige |
| migración matrículas | Sí | `database/migrations/2026_04_27_060926_create_matriculas_table.php` | Operativa | No hay `unique(matriculas.alumno_id)` físico | Agregar restricción DB para reforzar regla de matrícula única |
| migración materias_cursadas | Sí | `database/migrations/2026_04_27_060931_create_materias_cursadas_table.php` + `2026_05_05_140000...` | Operativa | No snapshot documental dedicado | Crear estrategia `documento_materias_snapshot` explícita |
| migración trayectorias_academicas | Sí | `database/migrations/2026_04_27_061134_create_trayectorias_academicas_table.php` + `2026_05_05_140000...` | Operativa | Base inicial tenía unique distinto; ya corregido por migración posterior | Mantener solo `unique(matricula_id)` y validar en prod |
| migración documentos_academicos | Sí | `database/migrations/2026_04_27_061211_create_documentos_academicos_table.php` | Operativa | No `trayectoria_academica_id` FK explícito | Definir si se requiere FK directa a trayectoria |
| migración url_short_tokens | Sí | `database/migrations/2026_04_27_061218_create_url_short_tokens_table.php` | Operativa | Falta ruta pública de consulta corta | Exponer endpoint público controlado |
| migración cadena_original_* | Sí | `database/migrations/2026_04_27_061523...` y `061525...` | Operativa (placeholder) | Reglas seed son placeholder | Versionar reglas oficiales DEC |
| migración documento_firmas | Sí | `database/migrations/2026_04_27_061531_create_documento_firmas_table.php` | Operativa (simulada) | No campos SEP finales explícitos (ej. `selloSep`) | Extender esquema según contrato SEP real |
| migración integraciones_logs | Sí | `database/migrations/2026_04_27_061533_create_integraciones_logs_table.php` | Operativa | Sin integración real SEP/Jasper | Activar cuando exista contrato |
| migración documento_estados_historial | Sí | `database/migrations/2026_04_27_061536_create_documento_estados_historial_table.php` | Operativa | No `estado_sep` | Evaluar estado SEP separado |
| migración auditoria_eventos | Sí | `database/migrations/2026_04_27_061542_create_auditoria_eventos_table.php` | Operativa | Cobertura parcial de eventos | Completar matriz de eventos críticos |
| modelo `Alumno` | Sí | `app/Models/Alumno.php` | Usa `HasOne matricula()` + normalización en `saving` | Mantiene `HasMany matriculas()` deprecated | Retirar gradualmente usos legacy |
| modelo `Matricula` | Sí | `app/Models/Matricula.php` | `belongsTo Alumno`, `hasOne Trayectoria` | Sin `unique` DB en alumno | Endurecer en DB |
| modelo `DocumentoAcademico` | Sí | `app/Models/DocumentoAcademico.php` | Relaciona folio/token/versiones/firmas/logs | No tabla `documento_folios` dedicada | Documentar equivalencia con `folios` |
| relaciones Eloquent clave | Sí | `app/Models/*.php` | Coherentes con dominio principal | Algunas compatibilidades legacy aún activas | Plan de deprecación controlado |
| enum estados | Sí | `app/Enums/Certificacion/*.php` | `Workflow/Cadena/Xml/Firma/Pdf` presentes | Falta enum explícito de `estado_sep` | Definir modelo SEP separado |
| service workflow | Sí | `app/Services/Certificacion/DocumentoAcademicoWorkflowService.php` | Operativo | Prepara firma, no firma real | Integrar orquestación real por colas |
| service validación académica | Sí | `app/Services/Certificacion/ValidacionAcademicaDocumentoService.php` | Completo para precondiciones académicas | Gates cadena/xml/firma siguen `TODO` | Implementar validación normativa real |
| service trayectoria | Sí | `app/Services/Certificacion/TrayectoriaAcademicaService.php` | Recalcula y bloquea en estados críticos | Depende de configuración mínima | Agregar reglas por catálogo oficial |
| service cadena/XML | Sí | `app/Services/Certificacion/CadenaOriginalBuilder.php`, `XmlDocumentoAcademicoBuilder.php` | Placeholder controlado | No DEC Normal 2024-2025 exacto | Crear builders DEC oficiales |
| service firma | Sí | `app/Services/Certificacion/FirmarDocumentoAcademicoService.php` + `SinceFirmaClient.php` | Simulada | Sin conexión real since-service | Implementar cliente real con hardening |
| service PDF | Sí | `app/Services/Certificacion/EnsurePdfDocumentoService.php` | Simulada | Sin QR dedicado ni plantilla oficial validada | Implementar QR + layout oficial |
| controller captura | Sí | `app/Http/Controllers/Api/V1/Certificacion/*` | Cobertura de alumnos/matrículas/materias/trayectoria/documento | `AlumnoCapturaController` con conflicto git | Resolver conflicto urgentemente |
| request validación | Sí | `app/Http/Requests/Certificacion/*` | Amplia | `StoreAlumnoCapturaRequest` con conflicto git | Resolver conflicto y normalizar reglas |
| resource API | Sí | `app/Http/Resources/Certificacion/*` | Devuelve estados y campos derivados CURP/RFC | Expone derivados (internos) en API | Decidir visibilidad pública de derivados |
| policy | Sí | `app/Policies/*.php` | Control por permisos + alcance | No policy dedicada para materias/trayectoria/documento firma | Evaluar políticas más granulares |
| route API | Sí | `routes/api.php` | Flujo documental y captura cubiertos | Sin endpoint público final por URL corta | Agregar endpoint de consulta pública |
| seeder | Sí | `database/seeders/*` | Roles, reglas, plantillas, firma config | Muchos valores `placeholder` | Separar seed demo vs producción |
| test backend | Sí | `tests/Feature/Certificacion/*`, `tests/Unit/Certificacion/*` | Cobertura buena de base | Falta cobertura DEC/UPN/Título/Grado normativa | Añadir suites por especificación |
| React page/component | Sí | `resources/js/pages/*`, `resources/js/components/*` | Flujo de captura presente | Sin módulo técnico de firma real/PDF/QR final | Añadir vistas operativas por etapa |

## 3) Comparativo legacy vs SICES v2

| Función legacy | Tabla/campo legacy | Equivalente esperado en SICES v2 | Existe en SICES v2 | Evidencia archivo | Brecha | Acción recomendada |
|---|---|---|---|---|---|---|
| Certificado base | `e11superior_cert` | `documentos_academicos` | Sí | `database/migrations/2026_04_27_061211_create_documentos_academicos_table.php` | Parcial en estados SEP | Añadir estado SEP y campos finales |
| Materias certificado | `e11materias_cert` | `materias_cursadas` + `documento_materias_snapshot` | Parcial | `create_materias_cursadas_table.php` | Falta snapshot explícito por documento | Crear tabla snapshot |
| Cadena original | `ocadena_original` | `cadena_original_generadas` | Sí | `create_cadena_original_generadas_table.php` | Builder aún placeholder | Implementar cadena DEC oficial |
| XML original | `oxml` | `documento_xmls.xml_original` (equiv) | Parcial (equiv en `documento_versiones`) | `create_documento_versiones_table.php` (`tipo=XML_ORIGINAL`) | No tabla `documento_xmls` nominal | Definir convención oficial |
| XML SEP timbrado | `oxml_sep` | `documento_xmls.xml_timbrado_sep` (equiv) | Parcial (equiv `XML_FIRMADO_SEP`) | `documento_versiones.tipo` | No semántica SEP final cerrada | Ajustar nomenclatura/contrato |
| sello DEC | `osellocertficado` | `documento_firmas.sello_dec` | No directo | `create_documento_firmas_table.php` | No columna específica | Añadir columnas SEP explícitas |
| sello título | `osellotitulo` | `documento_firmas.sello_documento` | No directo | `create_documento_firmas_table.php` | No columna específica | Diseñar campos por tipo |
| certificado responsable | `ofirmacertificadoresponsable` | `documento_firmas.certificado_responsable` | No directo | `documento_firmas` solo `response_payload`/`xml_firmado` | Campo no estructurado | Normalizar columnas |
| no certificado responsable | `onocertificado` | `documento_firmas.no_certificado_responsable` | No directo | idem | Falta columna dedicada | Agregar campo tipado |
| folio XML | `ofolio_xml` | `documento_folios.folio_xml` | Parcial (`folios.folio_completo`) | `create_folios_table.php` | Diferencia de naming/modelo | Mapear estándar en DTO/reportes |
| folio digital SEP | `ofoliodigitalsep` | `documento_folios.folio_digital_sep` | Parcial (`documentos_academicos.folio_digital_sep` + `documento_firmas.folio_digital_sep`) | `create_documentos_academicos_table.php`, `create_documento_firmas_table.php` | Duplicidad de ubicación | Definir fuente única canónica |
| URL corta | `ourl_short` | `url_short_tokens` | Sí | `create_url_short_tokens_table.php` | Sin consulta pública final | Crear endpoint público seguro |
| URL consulta timbrado | `ourl_consulta_timbrado` | `documento_folios.url_consulta_timbrado` | No | N/A | No modelado | Agregar campo/tabla de consulta |
| PDF firmado | `opdf`/`oloadpdf` | `documento_pdfs` + `estado_pdf` | Parcial (equiv en `documento_versiones tipo=PDF_OFICIAL`) | `create_documento_versiones_table.php` | No tabla nominal `documento_pdfs` | Definir persistencia PDF oficial |
| estatus proceso | `oproceso_status` | `estado_workflow` | Sí | `documentos_academicos.estado_workflow` | Falta mapeo legacy formal | Crear tabla de equivalencias |
| situación firma/SEP | `osituac` | `estado_firma` / `estado_sep` | Parcial | `estado_firma` existe; `estado_sep` no | Falta estado SEP explícito | Incorporar `estado_sep` |
| status interno | `istatus` | auditoría/referencia | Parcial | `auditoria_eventos`, `documento_estados_historial` | Sin campo legacy mapping explícito | Añadir mapping documental |

## 4) Validación matrícula única

| Regla | Existe en SICES v2 | Archivo/migración/modelo | Cumple sí/no | Acción |
|---|---|---|---|---|
| Alumno tiene `hasOne Matricula` | Sí | `app/Models/Alumno.php` (`matricula()`) | Sí | Mantener como relación principal |
| Matricula `belongsTo Alumno` | Sí | `app/Models/Matricula.php` | Sí | Sin acción |
| `matriculas.alumno_id` unique físico | No | `create_matriculas_table.php` | No | Agregar índice único DB |
| backend impide segunda matrícula | Sí | `StoreMatriculaCapturaRequest.php` (`withValidator`) | Sí (lógico) | Complementar con unique DB |
| materias dependen de `matricula_id` | Sí | `create_materias_cursadas_table.php` | Sí | Sin acción |
| trayectoria depende de `matricula_id` y es única | Sí | `create_trayectorias_academicas_table.php` + `2026_05_05_140000...` | Sí | Verificar ejecución en entornos existentes |
| documentos referencian alumno/matrícula/trayectoria | Parcial | `documentos_academicos` tiene alumno+matrícula; no FK directa trayectoria | Parcial | Evaluar `trayectoria_academica_id` |

## 5) Validación CURP/RFC

- `alumnos.curp` existe y es unique (migración base).
- `curp_raiz`, `curp_digito`, `rfc`, `rfc_raiz`, `rfc_homoclave` existen (migración `2026_05_05_140000...`).
- Derivación automática sí existe en `IdentificadorAlumnoService::aplicarAlModelo()` invocado en `Alumno::booted()->saving`.
- Frontend no captura `curp_raiz/curp_digito` (correcto), pero tampoco captura `rfc` en `AlumnoFormPage` (campo backend sí existe, UI aún incompleta).
- `AlumnoResource` expone derivados en respuesta (`curp_raiz`, `curp_digito`, `rfc_raiz`, `rfc_homoclave`).
- `XmlDocumentoAcademicoBuilder` actual no implementa XML DEC Normal; por tanto no hay garantía de uso de `Alumno@curp` completo en formato oficial.

**Conclusión CURP/RFC:** modelado base correcto, implementación normativa DEC aún pendiente.

## 6) Validación DEC Normal 2024-2025

Estado contra checklist solicitado:

- `spec_code = normal_dec_2024_2025`: **No evidencia**.
- `spec_version = 1.1`: **No evidencia**.
- XML version `1.0`: Sí en builder, pero en XML simulado (`XmlDocumentoAcademicoBuilder`).
- `tipoCertificado = 9`: **No evidencia estricta**.
- namespace `https://www.siged.sep.gob.mx/certificados`: **No evidencia** (seed de `xml_plantillas` trae `namespace = null`).
- XSD `NormalCertificacion1_0.xsd`: **No evidencia**.
- XSLT/cadena DEC oficial: **No evidencia**.
- Nodos DEC (`Dec`, `ServicioFirmante`, `FirmaResponsable`, etc.): **No implementados como estructura oficial**.
- Reglas de cadena DEC (doble pipe, no `Sep`, no `nombre asignatura`, sanitización pipes, inicio/fin `||`): **No implementadas como regla oficial**.

**Conclusión DEC Normal:** actualmente es infraestructura placeholder, no cumplimiento técnico 2024-2025.

## 7) Validación nodo Sep

- Nodo `Sep` opcional posterior al timbrado: **No evidencia explícita**.
- `CadenaOriginalSepBuilder`: **No existe**.
- `SepSelloBuilder`: **No existe**.
- Campos `folioDigital`, `fechaSep`, `selloDec`, `noCertificadoSep`, `selloSep` estructurados: **No modelados explícitos**.
- `FirmarDocumentoAcademicoService` y `SinceFirmaClient` operan en modo simulado, sin integración SEP real.

**Conclusión nodo Sep:** pendiente P0/P1 según salida a producción.

## 8) Validación UPN

Evidencia encontrada:

- Seeders incluyen referencias placeholder UPN:
  - `CadenaOriginalReglaSeeder` -> `CERTIFICADO_UPN_V1`
  - `XmlPlantillaSeeder` -> `XML_CERTIFICADO_UPN_V1`
  - `PlantillaDocumentoSeeder` -> `PDF_CERTIFICADO_UPN_JASPER_V1`
- No existen clases especializadas:
  - `XmlDecUpnBuilder`, `CadenaOriginalDecUpnBuilder`, `UpnDecSpec`
- No existe `tipo_documento = certificado_upn` (solo enum `certificado/titulo/grado`).
- No hay rutas ni tests UPN dedicados.

**Conclusión UPN:** hay intención en placeholders, pero sin especificación funcional cerrada ni evidencia operativa real.

## 9) Validación títulos y grados

| Documento | Legacy | SICES v2 actual | Brecha | Acción |
|---|---|---|---|---|
| Título | XML/cadena/sello/firma en scripts legacy dedicados | `tipo_documento='titulo'` existe en migración/enum/payload/plantillas placeholder | Falta builder oficial de cadena/XML/firma normativa para título | Crear pipeline `titulo` con pruebas E2E |
| Grado | XML/cadena/sello/firma en scripts legacy dedicados | `tipo_documento='grado'` existe en migración/enum/payload/plantillas placeholder | Falta builder oficial de cadena/XML/firma normativa para grado | Crear pipeline `grado` con pruebas E2E |

Notas:
- Existe soporte estructural transversal (`documento_payloads`, `documento_versiones`, `documento_firmas`) para `titulo` y `grado`.
- No existe implementación normativa final diferenciada por tipo en builders.

## 10) Validación firma electrónica

| Elemento firma | Legacy | SICES v2 actual | Cumple | Riesgo | Acción |
|---|---|---|---|---|---|
| Cliente firma externa | since-service / since-titulos | `SinceFirmaClient` | Parcial | Solo simulado, sin HTTP real | Implementar cliente real por entorno |
| Sello local | OpenSSL local | `OpenSslSelloService` | Parcial | Simulado determinista | Integrar firma real con certificados |
| Orquestación firma | scripts varios | `FirmarDocumentoAcademicoService` | Parcial | No validez SEP real | Cerrar flujo real + retries |
| Configuración firma | archivos/keys locales | `firma_configuraciones`, `credenciales_firma`, seeders | Parcial | `config/certificacion.php` incompleto para llaves/modos | Completar config tipada por ambiente |
| Logs integración | disperso | `integraciones_logs` | Sí (estructura) | Datos reales aún no existen | Instrumentar llamadas reales |
| Auditoría firma | limitada | `auditoria_eventos` + servicio | Parcial | Eventos no cubren toda matriz | Extender catálogo de eventos |

Seguridad:
- No se detecta exposición de secretos en este informe.
- No se imprimen llaves/credenciales.

## 11) Validación PDF/QR

| Elemento esperado | Estado en SICES v2 | Evidencia | Brecha | Acción |
|---|---|---|---|---|
| `EnsurePdfDocumentoService` | Sí | `app/Services/Certificacion/EnsurePdfDocumentoService.php` | Flujo simulado | Implementar render oficial |
| `DocumentStorageService` | Sí | `app/Services/Certificacion/DocumentStorageService.php` | No estrategia final de storage firmada | Definir disco/ruta/versionado productivo |
| `QrDocumentoAcademicoService` | No | Sin coincidencias | Servicio inexistente | Implementar QR dedicado |
| `documento_pdfs` tabla nominal | No (equivalente por `documento_versiones`) | `documento_versiones.tipo=PDF_OFICIAL` | Diferencia de modelo esperado | Decidir tabla dedicada o convención única |
| hash PDF | Sí | `documento_versiones.sha256` | Parcial | Falta hash firmado oficial/validación externa | Añadir verificación cruzada |
| tamaño QR 2.75x2.75 cm | No evidencia | N/A | No implementado | Definir en template PDF oficial |
| URL verificación estatal/SIGED | Parcial | `token_consulta_publica` emitible | Sin endpoint público final de consulta | Implementar endpoint público y política de expiración |

## 12) Validación catálogos

| Catálogo | Legacy | SICES v2 tabla/modelo | Existe | Brecha | Acción |
|---|---|---|---|---|---|
| instituciones | `e11instituciones` | `instituciones` / `Institucion` | Sí | Sin campos DGP/CCT explícitos | Extender catálogo institucional |
| sedes | (equiv operativa) | `sedes` / `Sede` | Sí | Sin CCT por sede explícito | Añadir CCT y validaciones |
| CCT | legacy en flujos | No explícito | No | Falta campo dedicado | Crear catálogo/campo oficial |
| claveInstitucion DGP | legacy | No explícito | No | Falta modelado | Añadir campo controlado |
| carreras | `e11ctplan`/otros | `programas_estudio` + `planes_estudio` | Sí (equivalente) | Equivalencia formal no documentada | Definir mapping funcional |
| claveCarrera | legacy | `programas_estudio.clave` | Sí | Validación normativa pendiente | Catálogo oficial SEP |
| planes de estudio | `e11ctplan` | `planes_estudio` | Sí | Falta versionado normativo SEP | Extender metadatos |
| materias por plan | `e11materias_cert` parcial | `materias` + `materias_cursadas` | Sí | Falta snapshot por documento | Crear snapshot |
| semestres | legacy implícito | `materias.semestre`, `materias_cursadas.semestre` | Sí | Sin catálogo semestres formal | Definir catálogo si aplica |
| modalidades | `e11ctmodalidad` | `ofertas_academicas.modalidad` enum | Sí | No tabla catálogo dedicada | Evaluar catálogo parametrizable |
| cargos firmantes | legacy firmas usuarios | `firmantes_autorizados.cargo` | Sí | Sin catálogo maestro de cargos | Crear catálogo |
| entidades | `e11municipios`/entidad | No tabla entidades federativas dedicada | No | Falta catálogo | Implementar catálogo oficial |
| municipios | `e11municipios` | No tabla dedicada | No | Falta catálogo | Implementar catálogo oficial |
| tipos certificación | `e11cttipcert` | enum `TipoCertificacion` + campo `tipo_certificacion` | Parcial | Sin tabla catálogo | Crear tabla si negocio la requiere |
| géneros | legacy | `alumnos.genero` texto libre | Parcial | Sin catálogo normalizado | Catalogar género |
| observaciones académicas | legacy reportes | `documento_observaciones` | Sí | Falta taxonomía completa | Expandir catálogo de observación |
| tipos evaluación | legacy académico | No catálogo explícito | No | Falta modelado | Implementar catálogo |

## 13) Validación roles/permisos

Roles solicitados:

- Existen: `control_escolar_escuela`, `director_escuela`, `educacion_superior`, `sistemas`, `admin`, `superadmin`, `auditor`, `consulta`.
- Evidencia: `database/seeders/RolesAndPermissionsSeeder.php`.

Permisos solicitados vs actuales:

| Permiso solicitado | Estado | Evidencia | Brecha |
|---|---|---|---|
| `alumnos.*` | Parcial (nombres concretos) | `ver_alumnos`, `gestionar_alumnos` | No wildcard |
| `matriculas.*` | Parcial | `ver_matriculas`, `gestionar_matriculas` | No wildcard |
| `materias_cursadas.*` | Parcial | `ver_materias`, `gestionar_materias` | Naming distinto |
| `trayectorias.*` | Parcial | `ver_trayectorias`, `gestionar_trayectorias` | Naming distinto |
| `documentos.*` | Parcial granular | varios (`crear_documentos`, `aprobar_documentos`, etc.) | No wildcard |
| `documentos.aprobar` | Sí (equivalente) | `aprobar_documentos` | Diferencia de naming |
| `documentos.firmar` | Parcial | `preparar_documento_firma`, `solicitar_firma` | Falta permiso final operativo visible |
| `documentos.generar_xml` | Sí | `generar_xml` | Sin endpoint operativo expuesto |
| `documentos.generar_pdf` | Sí | `generar_pdf` | Sin endpoint operativo expuesto |
| `documentos.cancelar` | Sí | `cancelar_documentos` | naming distinto |
| `observaciones.*` | Parcial | acciones vía controladores + permisos documento/rechazo | No namespace de permisos específico |

## 14) Validación estados

| Estado legacy | Significado | Estado nuevo | Existe en SICES v2 | Acción |
|---|---|---|---|---|
| `oproceso_status` | workflow general | `estado_workflow` | Sí | Definir mapping formal legacy->nuevo |
| `osituac` | situación firma/SEP | `estado_firma` (+ faltante `estado_sep`) | Parcial | Incorporar `estado_sep` |
| `istatus` | estado interno/operativo | `auditoria_eventos` + historial | Parcial | Definir equivalencia de negocio |
| `opdf` | estado PDF | `estado_pdf` | Sí | Mapear valores legacy |
| `oloadpdf` | carga PDF | `documento_versiones tipo=PDF_OFICIAL` | Parcial | Crear convención explícita |
| `oxlscontrol` | control técnico | `integraciones_logs`/metadata | Parcial | Diseñar campos equivalentes |
| `oxlsdescripcion` | descripción técnica | `error_message` + `metadata` | Parcial | Definir estandarización |

## 15) Validación auditoría

| Evento | Legacy | SICES v2 actual | Falta | Acción |
|---|---|---|---|---|
| alta alumno | parcial | Sí (`alumno.creado`) | - | Mantener |
| edición alumno | parcial | Sí (`alumno.actualizado`) | - | Mantener |
| matrícula | parcial | Sí (`matricula.creada/actualizada`) | - | Mantener |
| materias | parcial | Sí (`materia_cursada.creada/actualizada`) | - | Mantener |
| trayectoria | parcial | Sí (`trayectoria_academica.sincronizada`) | - | Mantener |
| aprobación | parcial | Sí (`documento_academico.workflow.aprobado`) | - | Mantener |
| rechazo | parcial | Sí (`documento_academico.workflow.rechazado`) | - | Mantener |
| cadena | parcial | Sí (`CADENA_GENERADA`) | detalle normativo | Estandarizar naming de eventos |
| XML | parcial | Sí (`XML_GENERADO`) | validación oficial | Ampliar metadatos normativos |
| firma | parcial | Sí (`FIRMA_SIMULADA_COMPLETADA`) | firma real | Distinguir evento real vs simulado |
| SEP | legado externo | No real | flujo real | Integrar cliente real y eventos SEP |
| PDF | parcial | Sí (`PDF_BASE_GENERADO`) | PDF oficial | Añadir evento oficial firmado |
| consulta | parcial | Parcial (vía API, sin evento explícito) | evento consulta/descarga | Instrumentar acceso |
| descarga | parcial | Parcial | evento dedicado | Añadir eventos de descarga |
| error | parcial | Sí en `integraciones_logs` | unificación con auditoría | Correlacionar logs + auditoría |
| reintento | parcial | Parcial (`reintentando` en estados firma) | flujos reales | Implementar retry real |
| cancelación | parcial | Sí (`workflow.cancelado`) | cobertura completa por módulo | Extender |
| reemisión | parcial | No explícita | proceso de reemisión | Diseñar flujo y evento |

## 16) Brechas finales priorizadas

### P0 crítico

1. **Conflictos Git activos en backend de captura de alumno**  
   - Evidencia: `StoreAlumnoCapturaRequest.php`, `AlumnoCapturaController.php` contienen marcadores `<<<<<<< ======= >>>>>>>`  
   - Archivo/tabla afectada: capa API de alumnos  
   - Impacto: riesgo de fallo de build/deploy y comportamiento inconsistente  
   - Recomendación: resolver conflicto y ejecutar pruebas API  
   - Esfuerzo: bajo

2. **No existe implementación normativa DEC Normal 2024-2025**  
   - Evidencia: sin `CadenaOriginalDecNormalBuilder`, sin `XmlDecNormalBuilder`, seeds placeholder  
   - Afectado: cadena/XML/firma  
   - Impacto: no apto para operación normativa  
   - Recomendación: construir pipeline oficial DEC + pruebas de conformidad  
   - Esfuerzo: alto

3. **Firma SEP real no implementada**  
   - Evidencia: `SinceFirmaClient` y `OpenSslSelloService` en modo simulado  
   - Afectado: firma/timbrado  
   - Impacto: no validez legal operativa  
   - Recomendación: integrar contrato real SEP/since y endurecer seguridad  
   - Esfuerzo: alto

### P1 importante

1. **Matrícula única no reforzada por restricción física DB**  
   - Evidencia: no `unique(matriculas.alumno_id)`  
   - Impacto: posible inconsistencia por concurrencia/importaciones  
   - Recomendación: agregar unique + plan de saneamiento  
   - Esfuerzo: medio

2. **Falta modelado explícito SEP (`estado_sep`, campos sello/certificado SEP)**  
   - Evidencia: estados actuales solo workflow/cadena/xml/firma/pdf  
   - Impacto: trazabilidad incompleta del ciclo SEP  
   - Recomendación: ampliar esquema de estados y firma  
   - Esfuerzo: medio

3. **Falta endpoint público final para URL corta**  
   - Evidencia: existe emisión token pero no ruta pública de consulta  
   - Impacto: flujo consulta pública incompleto  
   - Recomendación: ruta pública segura + expiración + auditoría acceso  
   - Esfuerzo: medio

4. **Catálogos normativos incompletos (entidades/municipios/CCT/tipos evaluación)**  
   - Evidencia: no tablas dedicadas  
   - Impacto: brecha de datos para XML normativo  
   - Recomendación: modelar catálogos oficiales y validaciones  
   - Esfuerzo: medio-alto

5. **UPN sin especificación operativa cerrada**  
   - Evidencia: solo placeholders en seeders  
   - Impacto: incertidumbre funcional  
   - Recomendación: definir estándar UPN antes de implementar builders  
   - Esfuerzo: medio

### P2 posterior

1. **Alinear naming de permisos a convención `modulo.accion`**  
   - Evidencia: permisos granulares actuales usan snake_case operativo  
   - Impacto: mantenibilidad  
   - Recomendación: capa de alias/migración de permisos  
   - Esfuerzo: medio

2. **Separar tablas nominales para XML/PDF/snapshots si negocio lo exige**  
   - Evidencia: hoy se resuelve con `documento_versiones`  
   - Impacto: claridad de dominio/reportes  
   - Recomendación: decidir entre normalización adicional o convención actual  
   - Esfuerzo: medio

3. **Cobertura de pruebas ampliada para título/grado/UPN y consultas públicas**  
   - Evidencia: cobertura actual principalmente certificado base/simulado  
   - Impacto: riesgo de regresiones  
   - Recomendación: suites feature/unit por tipo documental  
   - Esfuerzo: medio

## 17) Respuesta ejecutiva final

1. **Qué del legacy ya está cubierto en SICES v2**  
   - Captura alumno/matrícula/materias/trayectoria/documento, estados base, emisión token corto, folio interno, trazabilidad de estados y auditoría base.

2. **Qué del legacy no está cubierto**  
   - Cumplimiento normativo DEC Normal oficial, timbrado/firma SEP real, nodo Sep estructurado, consulta pública final por URL corta, mapping formal de varios campos legacy.

3. **Qué de SICES v2 está bien modelado**  
   - Dominio central, relaciones Eloquent, servicios de orquestación, estados internos, versionado de payload/artefactos, roles y permisos base.

4. **Qué de SICES v2 está mal modelado o incompleto**  
   - Restricción física de matrícula única, ausencia de `estado_sep`, catálogos regulatorios faltantes, placeholders no sustituidos por reglas oficiales, conflicto Git activo en backend.

5. **Qué falta para DEC Normal**  
   - Builders oficiales cadena/XML DEC 2024-2025, namespace/XSD/XSLT, validaciones exactas de atributos y orden, pruebas de conformidad.

6. **Qué falta para UPN**  
   - Definición normativa y técnica cerrada; hoy solo hay placeholders.

7. **Qué falta para títulos**  
   - Implementación completa de cadena/XML/firma/pipeline productivo por tipo `titulo`.

8. **Qué falta para grados**  
   - Implementación completa de cadena/XML/firma/pipeline productivo por tipo `grado`.

9. **Qué falta para firma**  
   - Integración real since/SEP, gestión segura de credenciales productivas, retry/circuit breaker y observabilidad operativa final.

10. **Qué falta para PDF/QR**  
   - Servicio QR dedicado, especificación visual oficial (incluyendo tamaño), URL verificación final y plantillas productivas.

11. **Qué se debe implementar primero**  
   - (P0) resolver conflictos Git activos, cerrar especificación DEC, integrar firma real SEP/since; luego (P1) catálogos normativos, estado SEP y endpoint público.

---

## Anexo de evidencia clave (rutas)

- Dominio y estados: `app/Models/DocumentoAcademico.php`, `app/Enums/Certificacion/*`
- Flujo: `app/Services/Certificacion/DocumentoAcademicoWorkflowService.php`
- Validación: `app/Services/Certificacion/ValidacionAcademicaDocumentoService.php`
- Cadena/XML: `app/Services/Certificacion/CadenaOriginalBuilder.php`, `app/Services/Certificacion/XmlDocumentoAcademicoBuilder.php`
- Firma/PDF: `app/Services/Certificacion/FirmarDocumentoAcademicoService.php`, `app/Services/Certificacion/EnsurePdfDocumentoService.php`
- Auditoría: `app/Services/Certificacion/AuditoriaService.php`, `database/migrations/2026_04_27_061542_create_auditoria_eventos_table.php`
- Conflictos detectados: `app/Http/Requests/Certificacion/StoreAlumnoCapturaRequest.php`, `app/Http/Controllers/Api/V1/Certificacion/AlumnoCapturaController.php`

## Actualización 2026-05-06 (implementación estructural)

Se aplicaron correcciones estructurales para preparar DEC Normal 2024-2025 en modo controlado:

- Conflictos Git resueltos en:
  - `app/Http/Requests/Certificacion/StoreAlumnoCapturaRequest.php`
  - `app/Http/Controllers/Api/V1/Certificacion/AlumnoCapturaController.php`
- Matrícula única reforzada:
  - comando `sices:detectar-matriculas-duplicadas`
  - migración `2026_05_06_140820_add_unique_alumno_id_to_matriculas_table.php`
- Estado SEP separado:
  - enum `app/Enums/Certificacion/EstadoSep.php`
  - columna `documentos_academicos.estado_sep`
  - soporte en `DocumentoEstadoService`, `DocumentoAcademico`, `DocumentoAcademicoCapturaResource`
- Snapshot congelado de materias por documento:
  - tabla `documento_materias_snapshot`
  - modelo `DocumentoMateriaSnapshot`
  - servicio `DocumentoMateriaSnapshotService`
  - integración al aprobar/preparar firma
- Formalización de tipos en `documento_versiones`:
  - enum `DocumentoVersionTipo`
  - nuevos tipos DEC (`XML_DEC_LOCAL`, etc.)
  - columnas `spec_code`, `spec_version`, `generado_por`, `generado_en`
- Base DEC Normal 2024-2025:
  - `app/Support/Certificacion/Specs/DecNormal2025Spec.php`
  - `DecNormal2025PayloadBuilder`
  - `ValidacionDecNormal2025Service`
  - `CadenaOriginalDecNormal2025Builder`
  - `XmlDecNormal2025Builder`
  - documentación técnica en `resources/certificacion/normal/2024-2025/README.md`
