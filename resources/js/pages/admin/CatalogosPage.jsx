import { useEffect, useMemo, useState } from 'react';
import { catalogosAcademicosApi } from '../../api/catalogosAcademicos';
import { CatalogoModuleCard } from '../../components/catalogos/CatalogoModuleCard';
import { CatalogoResumenCards } from '../../components/catalogos/CatalogoResumenCards';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { EsIcons } from '../../components/educacionSuperior';
import { AlertBox } from '../../components/ui/AlertBox';
import { ModuleHeader } from '../../components/ui/ModuleHeader';
import { RESUMEN_CARDS } from '../catalogosAcademicos/catalogosAcademicosConfig';

const MODULOS_ESTRUCTURA = [
    {
        key: 'academicos',
        title: 'Catálogos académicos',
        description: 'Instituciones, sedes, programas, planes de estudio, materias y estructura curricular.',
        to: '/app/catalogos-academicos',
        resumenKey: 'instituciones',
        metricLabel: 'instituciones registradas',
        icon: EsIcons.graduation,
    },
    {
        key: 'subsistemas',
        title: 'Subsistemas / Instituciones',
        description: 'Consulta de subsistemas, instituciones y su organización académica.',
        to: '/app/catalogos/subsistemas-instituciones',
        resumenKey: 'instituciones',
        metricLabel: 'instituciones registradas',
        icon: EsIcons.building,
    },
    {
        key: 'sedes',
        title: 'Sedes y subsedes',
        description: 'Consulta de sedes, subsedes y relación con instituciones.',
        to: '/app/catalogos/sedes',
        resumenKey: 'sedes',
        metricLabel: 'sedes registradas',
        icon: EsIcons.building,
    },
    {
        key: 'municipios',
        title: 'Municipios',
        description: 'Catálogo territorial de municipios y entidades federativas.',
        to: '/app/catalogos/municipios',
        resumenKey: null,
        metricLabel: null,
        icon: EsIcons.mapPin,
    },
    {
        key: 'ciclos',
        title: 'Ciclos y periodos',
        description: 'Configuración de ciclos escolares, periodos académicos y ventanas de operación.',
        to: '/app/catalogos/ciclos-periodos',
        resumenKey: 'ciclos_escolares',
        metricLabel: 'ciclos registrados',
        icon: EsIcons.clock,
    },
    {
        key: 'programas',
        title: 'Programas y ofertas',
        description: 'Programas, planes de estudio, ofertas académicas y estructura curricular.',
        to: '/app/catalogos/programas-ofertas',
        resumenKey: 'programas_estudio',
        metricLabel: 'programas de estudio',
        icon: EsIcons.book,
    },
];

export function CatalogosPage() {
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorResumen, setErrorResumen] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setErrorResumen('');

        catalogosAcademicosApi
            .resumen()
            .then((res) => {
                if (cancelled) return;
                setResumen(res?.data ?? null);
            })
            .catch(() => {
                if (cancelled) return;
                setResumen(null);
                setErrorResumen('No fue posible cargar el resumen de catálogos.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const modulos = useMemo(() => MODULOS_ESTRUCTURA.map((modulo) => ({
        ...modulo,
        metric: modulo.resumenKey && resumen?.[modulo.resumenKey]?.total != null
            ? resumen[modulo.resumenKey].total
            : null,
    })), [resumen]);

    return (
        <DashboardShell>
            <ModuleHeader
                title="Catálogos institucionales"
                subtitle="Consulta y administración de la estructura académica, territorial y operativa del sistema."
            />

            {errorResumen ? <AlertBox type="warning" message={errorResumen} /> : null}

            {loading ? (
                <p className="inst-muted mb-4 text-sm">Cargando resumen de catálogos...</p>
            ) : null}

            {!loading && resumen ? (
                <div className="mb-6">
                    <CatalogoResumenCards cards={RESUMEN_CARDS} resumen={resumen} />
                </div>
            ) : null}

            <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Módulos de estructura
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {modulos.map((modulo) => (
                        <CatalogoModuleCard
                            key={modulo.key}
                            title={modulo.title}
                            description={modulo.description}
                            to={modulo.to}
                            metric={modulo.metric}
                            metricLabel={modulo.metricLabel}
                            status="Disponible"
                            icon={modulo.icon}
                        />
                    ))}
                </div>
            </section>
        </DashboardShell>
    );
}
