# Diagnóstico: Control escolar, expediente académico y certificación — SICES v2

Fecha de referencia del análisis: 2026-05-05.  
Ámbito: flujo **Alumno → Matrícula única → Materias cursadas → Trayectoria → Documento académico** hasta puntos técnicos cadena/XML/firma/PDF, sin especificación oficial SEP/DGAIR/MEC inventada.

---

## 1. Qué ya existía (y funcionalidad asociada)

- **Modelos y BD base**: `alumnos`, `matriculas`, `materias_cursadas`, `trayectorias_academicas`, `documentos_academicos`, ofertas, instituciones/sedes/región, pivotes de alcance usuario ↔ institución/sede/región.
- **Enums de workflow y estados** en documento: `EstadoWorkflow`, `EstadoCadena`, `EstadoXml`, `EstadoFirma`, `EstadoPdf` (alineados en buena medida con los “mínimos deseables”; `estado_workflow` incluye además `pendiente` como estado operativo intermedio ya usado en captura).
- **Servicios consolidados**:
  - `CertificacionAlcanceService` (alcance territorial institucional sobre ofertas/documentos).
  - `ValidacionAcademicaDocumentoService` + `DocumentoAcademicoRequisitosService` (reglas académicas previas a revisión/aprobación/listo para firma).
  - `DocumentoAcademicoWorkflowService`, `DocumentoAcademicoCapturaService`, `DocumentoEstadoService`.
  - `CadenaOriginalBuilder`, `XmlDocumentoAcademicoBuilder`, `FirmarDocumentoAcademicoService`, `OpenSslSelloService`, `DocumentStorageService`, `AuditoriaService` (puntos técnicos ya presentes; varios en modo simulado/plantilla).
  - `BandejaDocumentoAcademicoService` (bandejas por rol ya probadas en Feature tests).
- **API** bajo `routes/api.php` (`v1/certificacion/...`) para alumnos, matrículas, materias cursadas, trayectoria, documentos y bandejas.
- **Policies**: `AlumnoPolicy`, `MatriculaPolicy`, `DocumentoAcademicoPolicy` (incluye restricciones por rol en aprobación/consulta/firma simulada).
- **Pruebas**: `BandejaDocumentoAcademicoApiTest`, `ValidacionAcademicaDocumentoServiceTest`.

---

## 2. Qué estaba correcto conceptualmente

- Separación **API + servicios** para documento y alcance institucional (`ofertaEnAlcance`, filtros de bandeja documental).
- **Validación académica explícita** antes de revisión/aprobación (alumno, matrícula, oferta, materias mínimas, trayectoria mínima, observaciones en aprobación).
- Documento ya modela campos previos para **cadena/XML/firma/PDF** sin asumir implementación SEP completa.

---

## 3. Qué estaba incompleto o incoherente respecto al flujo deseado

| Tema | Situación previa |
|------|-------------------|
| **Matrícula única por alumno** | Tabla permite múltiples `matriculas` por `alumno_id` (solo índices; sin regla fuerte aplicada siempre desde API). Relación modelo `Alumno::matriculas()` era `HasMany`. |
| **CURP / RFC derivados** | No existían `curp_raiz`, `curp_digito`, `rfc_raiz`, `rfc_homoclave` ni centralización para normalización. |
| **Duplicidad de materias cursadas** | Sin restricción compuesta índice; riesgo de duplicados lógicos (misma materia/clave mismo ciclo/periodo). |
| **Trayectoria única por matrícula** | Unique compuesto `(alumno_id, matricula_id)` redundante si la matrícula ya es única por alumno; consolidación automática desde materias no estaba centralizada. |
| **Crear borrador de documento** | Se creaba registro sin validar el mismo paquete de requisitos académicos que se exige para enviar a revisión (inconsistencia UX/datos). |
| **Alcance territorial sobre alumnos** | Listado/index de alumnos no filtraba por institución vía matrícula/oferta; `AlumnoPolicy::view` no contemplaba alcance (solo permiso `ver_alumnos`). |
| **Estado XML `validado`** | Enum PHP y columna MySQL no contemplaban explícitamente `validado` (existían `sellado`/`timbrado` como extensiones técnicas). |
| **Auditoría granular** | `AuditoriaService` existía pero no había registro uniforme en todas las entidades de captura (alumno/matricula/materia/trayectoria/recalculo). |
| **Pruebas de flujo de negocio** | Faltaban casos automáticos para matrícula única, normalización CURP, bloqueo de recálculo con documento aprobado/firmado, y alcance de alumnos. |

---

## 4. Qué se corrigió / se añadió en esta iteración (resumen técnico)

- **Migración** `2026_05_05_140000_control_escolar_identificadores_trayectoria_materias_xml.php`:
  - Columnas en `alumnos`: `rfc`, `curp_raiz`, `curp_digito`, `rfc_raiz`, `rfc_homoclave` (derivadas; no se capturan desde UI como campos libres).
  - Índice único compuesto en `materias_cursadas` para evitar duplicados lógicos (`matricula_id`, `ciclo_escolar_id`, `clave`, `periodo`). *Nota MySQL/SQLite: filas con `periodo` NULL pueden seguir permitiendo más de un NULL en la práctica del motor; la validación a nivel request refuerza el caso NULL.*
  - `trayectorias_academicas`: sustitución de unique `(alumno_id, matricula_id)` por **unique(`matricula_id`)** (trayectoria única por matrícula).
  - **MySQL**: ampliación del enum `estado_xml` en `documentos_academicos` con valor `validado` (en SQLite/testing la columna se comporta como texto; no requiere alteración).
- **`IdentificadorAlumnoService`**: normalización CURP/RFC y derivación de raíz/dígito/homoclave; CURP controlada `EXTRANJERO` documentada (riesgo de colisión si se reutiliza masivamente — ver pendientes).
- **`TrayectoriaAcademicaService`**: consolidación desde `materias_cursadas` de la matrícula (totales, créditos, promedios, conteos aprobatorios con umbral configurable `config/certificacion.php`).
- **`ValidacionAcademicaDocumentoService`**: API de métodos explícitos (`validarAlumno`, `validarCurpORExtranjero`, `validarMatriculaUnica`, `validarProgramaPlan`, `validarParaCrearBorrador`, `validarParaEnviarRevision`, validaciones cadena/XML/firma como **gates técnicos con mensajes claros**, etc.) sin inventar formato oficial.
- **`DocumentoAcademicoProcesoController@store`**: validación **antes** de persistir borrador mediante `validarParaCrearBorrador`.
- **`StoreMatriculaCapturaRequest`**: bloqueo de segunda matrícula activa por alumno (coherente con soft deletes).
- **`MateriaCursadaCapturaController`**: recálculo trayectoria post-alta cuando no existe documento bloqueante.
- **`TrayectoriaCapturaController`**: bloqueo de upsert manual si hay documento aprobado/firmado en la misma matrícula; si no, permite ajustes puntuales y luego opcionalmente reconsolidar (llamada a servicio).
- **`CertificacionAlcanceService`**: `aplicarAlcanceAlumnos`, `alumnoAccesible` para políticas/consultas.
- **`AlumnoPolicy`** + **`AlumnoCapturaController@index`**: filtrado institucional al listar alumno cuando el usuario **no** es `superadmin`/`admin`; `view/update` revisan alcance territorial vía matrícula→oferta.
- **Observers** (`Alumno`, `Matricula`, `MateriaCursada`) → eventos auditables vía `AuditoriaService`.
- **`EstadoXml::VALIDADO`**: caso enum listo para flujos técnicos futuros.
- **Clases de extensión / stubs solicitados**: `CadenaOriginalDocumentoAcademicoBuilder` (delegación sobre builder existente), `SelloDocumentoAcademicoService` (delegación sobre `OpenSslSelloService`), `NoCertificadoResponsableExtractor` (stub con TODO), comando `sices:report-duplicados-matricula`.

---

## 5. Pendiente para validar con SEP / DGAIR / legacy real

- Orden y contenido **exactos** de cadena original y hashing definitivo (**comparación** contra XML/cadena legacy aceptados).
- Estructura final del **XML** de certificado y XSD/reglas timbrado oficiales.
- Reglas de **calificación mínima aprobatoria**, equivalencias de texto, escala institucional y equivalencias SEP (el umbral configurable es solo placeholder operativo interno env-configurable).
- Política definitiva para **alumnos extranjeros sin CURP** (clave única multi-registro institucional; hoy sólo sentinel `EXTRANJERO`).
- ¿La matrícula institucional (`matricula` string) debe ser única sólo dentro de institución (**ya hay** unique compuesto `[oferta_academica_id, matricula]` a nivel BD) vs otras normas de negocio.
- vínculo explícito `documentos_academicos.trayectoria_academica_id` (opcional futuro FK) si se desea navegación estricta además del vínculo vía matrícula.

---

## 6. Riesgos técnicos detectados

- **Migración índices únicos** en bases con datos incoherentes previos pueden **fallar** al ejecutarse; usar `php artisan sices:report-duplicados-matricula` y scripts de saneamiento externos antes de desplegar.
- Índices únicos con columnas nullable (`periodo`) pueden no eliminar todos los casos edge en MySQL/SQLite; se mantiene **validación a nivel aplicación**.
- Alcance institucional de alumnos basado exclusivamente en **matrícula existente** implica que alumnos **sin ninguna matrícula** pueden no aparecer para usuarios restringidos (comportamiento intencional de seguridad; superadmin/admin conservan vista amplia si el negocio lo requiere).
- Endurecer `STORE` borrador aumenta rechazos esperables si instituciones inician datos parcialmente antes de tener materias (flujo debe educar desde UI cargando orden correcto).

---

## 7. Próximos pasos recomendados (prioridad)

1. Conectar vistas React al orden de captura (guías y deshabilitado de CTAs hasta cumplir precondiciones usando respuestas estructuradas de validación backend).
2. Importación masiva de materias con auditoría y reporte de duplicados antes de cargar BD.
3. Integración oficial de builders cadena/XML con versionado en `cadena_original_reglas`/`xml_plantillas` usando artefactos reales proporcionados por negocio/SEP.

---

*Fin del diagnóstico base. Mantener sincronizada esta nota ante cambios futuros en migraciones o reglas institucionales.*
