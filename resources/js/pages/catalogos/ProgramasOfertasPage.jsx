import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CatalogoTabbedView } from '../../components/catalogos/CatalogoTabbedView';
import { PROGRAMAS_OFERTAS_CARDS, PROGRAMAS_OFERTAS_TABS } from './programasOfertasConfig';

export function ProgramasOfertasPage() {
    const [searchParams] = useSearchParams();

    const fixedFilters = useMemo(() => {
        const f = {};
        const inst = searchParams.get('institucion_id');
        const sede = searchParams.get('sede_id');
        const prog = searchParams.get('programa_estudio_id');
        const plan = searchParams.get('plan_estudio_id');
        if (inst) f.institucion_id = inst;
        if (prog) f.programa_estudio_id = prog;
        if (plan) f.plan_estudio_id = plan;
        if (sede) f.sede_id = sede;
        return f;
    }, [searchParams]);

    const initialTab = searchParams.get('sede_id') ? 'ofertas' : 'programas';

    return (
        <CatalogoTabbedView
            breadcrumb="Programas y ofertas"
            title="Programas y ofertas"
            subtitle="Consulta integrada de programas de estudio, planes, ofertas académicas y estructura curricular."
            tabs={PROGRAMAS_OFERTAS_TABS}
            resumenCards={PROGRAMAS_OFERTAS_CARDS}
            resumenKeys={['programas_estudio', 'planes_estudio', 'ofertas_academicas', 'plan_materias', 'materias']}
            initialTab={initialTab}
            fixedFilters={fixedFilters}
        />
    );
}
