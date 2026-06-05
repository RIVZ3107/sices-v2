import { EsIcons } from '../../educacionSuperior/EsIcons';
import { EsMetricsStrip, formatEsNum, esMetricTones } from '../../educacionSuperior';
import { cpStyles } from './ciclosPeriodosStyles';

export function CicloSummaryCards({ resumen, compact = false }) {
    if (!resumen) return null;

    const cc = resumen.ciclos_escolares ?? {};
    const pe = resumen.periodos_escolares ?? {};
    const actual = resumen.ciclo_actual;
    const sinActual = !actual;

    const metrics = [
        {
            key: 'total',
            ...esMetricTones.blue,
            icon: EsIcons.clock,
            title: 'Ciclos escolares',
            value: formatEsNum(cc.total ?? 0),
            trend: `${formatEsNum(cc.activos ?? 0)} activos`,
            trendPrefix: '',
        },
        {
            key: 'actual',
            ...(sinActual ? esMetricTones.yellow : esMetricTones.green),
            icon: EsIcons.check,
            title: 'Ciclo actual',
            value: sinActual ? 'Sin ciclo actual' : (actual.clave ?? '—'),
            trend: sinActual ? 'Configure un ciclo para iniciar operación.' : 'Vigente',
            trendPrefix: '',
            valueSize: sinActual ? 16 : 22,
        },
        {
            key: 'activos',
            ...esMetricTones.teal,
            icon: EsIcons.book,
            title: 'Periodos activos',
            value: formatEsNum(pe.activos ?? 0),
            trend: 'En operación académica',
            trendPrefix: '',
        },
        {
            key: 'proximos',
            ...esMetricTones.purple,
            icon: EsIcons.clock,
            title: 'Próximos periodos',
            value: formatEsNum(pe.proximos ?? 0),
            trend: 'Por iniciar',
            trendPrefix: '',
        },
    ];

    return (
        <div style={compact ? { marginBottom: 4 } : undefined}>
            <EsMetricsStrip metrics={metrics} wide />
        </div>
    );
}
