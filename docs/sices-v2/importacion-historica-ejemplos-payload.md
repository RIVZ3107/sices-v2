# Importación histórica de materias — ejemplos de payload JSON

Endpoints base: `POST /api/v1/academico/importaciones`, `POST .../prevalidar`, `POST .../confirmar`.

## 1. Semestre (periodo curricular `semestre`)

```json
{
  "matricula_id": 42,
  "ciclo_escolar_id": 3,
  "filas_payload": [
    {
      "clave": "MAT101",
      "nombre": "Algebra",
      "tipo_periodo_curricular": "semestre",
      "numero_periodo_curricular": 1,
      "calificacion_final": 8.5,
      "periodo": "2024-2025",
      "creditos": 6,
      "tipo_evaluacion": "ordinaria",
      "estatus_acreditacion": "acreditada",
      "semestre_dec": 1
    }
  ],
  "metadata": {
    "tipo_importacion": "historial",
    "plan_referencia_ui": "Oferta LIC · plan_estudio_id 12"
  }
}
```

Para tipo `semestre`, `semestre_dec` puede alinearse con el número de semestre institucional según reglas del mapper.

## 2. Cuatrimestre (no semestral)

El archivo debe declarar el mapeo DEC explícito (`semestre_dec` o `semestre` institucional para XML). Ejemplo:

```json
{
  "matricula_id": 42,
  "ciclo_escolar_id": 3,
  "filas_payload": [
    {
      "clave": "CX101",
      "nombre": "Optativa I",
      "tipo_periodo_curricular": "cuatrimestre",
      "numero_periodo_curricular": 1,
      "semestre_dec": 2,
      "calificacion_final": 9,
      "periodo": "2023-2024",
      "tipo_evaluacion": "ordinaria",
      "estatus_acreditacion": "acreditada"
    }
  ]
}
```

## 3. Importación con `plan_materia` resuelto (recomendado)

Tras `prevalidar`, cada fila puede tener `plan_materia_id` y `coincide_plan: true`. En la confirmación se pueden reenviar las filas editadas solo en campos permitidos (calificación, periodo real, evaluación, estatus):

```json
{
  "filas_payload": [
    {
      "clave": "MAT101",
      "calificacion_final": 9,
      "tipo_periodo_curricular": "semestre",
      "numero_periodo_curricular": 1,
      "periodo": "2024-2025",
      "tipo_evaluacion": "ordinaria",
      "estatus_acreditacion": "acreditada"
    }
  ]
}
```

Los datos de catálogo (clave/nombre/créditos desde plan) los aplica el servidor al confirmar cuando existe `plan_materia_id` en la fila de ejecución conciliada.

## 4. Importación legacy controlada sin `plan_materia`

Requiere permiso `forzar_importacion_historica_sin_plan_materia`, `motivo_forzar_sin_plan` (mínimo 20 caracteres) y filas con `nombre` cuando no hay plan.

```json
{
  "forzar_sin_plan_materia": true,
  "motivo_forzar_sin_plan": "Histórico sep sep validado por coordinación académica expediente 2024-089.",
  "filas_payload": [
    {
      "clave": "LEG001",
      "nombre": "Asignatura solo en archivo histórico",
      "tipo_periodo_curricular": "semestre",
      "numero_periodo_curricular": 3,
      "semestre_dec": 3,
      "calificacion_final": 8,
      "periodo": "2019-2020",
      "estatus_acreditacion": "acreditada"
    }
  ]
}
```

Las filas quedan con `metadata.origen = legacy_controlado` y la matrícula puede marcarse como pendiente de validación normativa antes de certificación oficial.
