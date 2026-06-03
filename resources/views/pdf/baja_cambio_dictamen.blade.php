<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Dictamen {{ $solicitud->folio }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1e293b; }
        h1 { font-size: 18px; color: #185FA5; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .label { font-weight: bold; width: 35%; color: #64748b; }
    </style>
</head>
<body>
    <h1>Dictamen de baja o cambio de estatus</h1>
    <p><strong>Folio:</strong> {{ $solicitud->folio }}</p>
    <table>
        <tr><td class="label">Alumno</td><td>{{ trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido]))) }}</td></tr>
        <tr><td class="label">Matrícula</td><td>{{ $matricula->matricula ?? '—' }}</td></tr>
        <tr><td class="label">Tipo de solicitud</td><td>{{ $solicitud->tipo_cambio }}</td></tr>
        <tr><td class="label">Motivo</td><td>{{ $solicitud->motivo }}</td></tr>
        <tr><td class="label">Estatus</td><td>{{ $solicitud->estatus }}</td></tr>
        <tr><td class="label">Dictamen</td><td>{{ $solicitud->dictamen ?? '—' }}</td></tr>
        <tr><td class="label">Fecha efectiva</td><td>{{ $solicitud->fecha_efectiva?->format('d/m/Y') ?? '—' }}</td></tr>
    </table>
    <p style="margin-top: 32px; font-size: 10px; color: #64748b;">Documento generado por SICES v2 — Control Escolar.</p>
</body>
</html>
