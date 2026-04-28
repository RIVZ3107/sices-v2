import { useEffect, useState } from 'react';
import { sistemasApi } from '../../api/sistemas';
import { RoleDashboardTemplate } from '../dashboard/RoleDashboardTemplate';

export function DashboardTecnicoPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        sistemasApi.dashboard()
            .then((res) => setData(res.data))
            .catch((err) => {
                setData({
                    listos_para_firma: 0,
                    firmados: 0,
                    error_firma: 0,
                    pendientes_tecnicos: 0,
                });
                setError(err?.message ?? 'No se pudo cargar el dashboard tecnico.');
            });
    }, []);

    return (
        <RoleDashboardTemplate
            resumen={data}
            error={error}
            title="Panel Tecnico de Sistemas"
            subtitle="Seguimiento tecnico de documentos preparados para firma, incidencias e integraciones futuras."
            roleSummary={{
                label: 'Sistemas',
                text: 'Supervisa preparacion tecnica e incidencias sin ejecutar firma real.',
            }}
            metrics={[
                { label: 'Documentos preparados para firma', value: data?.listos_para_firma ?? 0 },
                { label: 'Documentos firmados', value: data?.firmados ?? 0 },
                { label: 'Incidencias tecnicas', value: data?.error_firma ?? 0, tone: 'danger' },
                { label: 'Pendientes tecnicos', value: data?.pendientes_tecnicos ?? 0, tone: 'warning' },
                { label: 'Integraciones pendientes', value: 3, subtitle: 'since-service, Jasper/PDF, XML/cadena' },
                { label: 'Logs recientes', value: data?.logs_recientes ?? 0, subtitle: 'Informacion no disponible' },
            ]}
            quickActions={[
                { label: 'Ver listos para firma', to: '/app/sistemas/listos-para-firma' },
                { label: 'Ver incidencias', to: '/app/documentos/bandejas/errores-firma' },
                { label: 'Ver configuracion tecnica', to: '/app/sistemas/configuracion' },
                { label: 'Ver logs tecnicos', to: '/app/sistemas/logs' },
            ]}
            priorities={[
                { label: 'Listos para firma', value: data?.listos_para_firma ?? 0 },
                { label: 'Pendientes tecnicos', value: data?.pendientes_tecnicos ?? 0 },
                { label: 'Incidencias', value: data?.error_firma ?? 0 },
            ]}
            statusItems={[
                { label: 'Listos firma', value: data?.listos_para_firma ?? 0 },
                { label: 'Firmados', value: data?.firmados ?? 0 },
                { label: 'Errores', value: data?.error_firma ?? 0 },
                { label: 'Pendientes', value: data?.pendientes_tecnicos ?? 0 },
            ]}
            notices={[
                { message: 'La firma real SEP/since-service se encuentra pendiente de activacion controlada.', type: 'warning' },
                { message: 'Integraciones since-service, Jasper/PDF oficial y XML/cadena real permanecen en fase posterior.', type: 'info' },
            ]}
            modules={[
                { name: 'Preparacion tecnica', description: 'Monitoreo de documentos listos y pendientes.', status: 'Operativo' },
                { name: 'Integraciones', description: 'Servicios externos y firma real.', status: 'Pendiente de activacion controlada' },
                { name: 'Configuracion tecnica', description: 'Vista informativa de parametros.', status: 'Operativo sin edicion critica' },
            ]}
            activities={[{ label: 'Incidencias abiertas', value: data?.error_firma ?? 0 }]}
            emptyInsight="No hay actividad tecnica reciente; el monitoreo se mantiene activo."
        />
    );
}
