import { CatalogoTabbedView } from '../../components/catalogos/CatalogoTabbedView';
import { CATALOGOS_ACADEMICOS_TABS, RESUMEN_CARDS } from './catalogosAcademicosConfig';

export function CatalogosAcademicosPage() {
    return (
        <CatalogoTabbedView
            breadcrumb="Catálogos académicos"
            title="Catálogos académicos"
            subtitle="Consulta institucional de instituciones, sedes, programas, planes de estudio, materias y ofertas académicas."
            tabs={CATALOGOS_ACADEMICOS_TABS}
            resumenCards={RESUMEN_CARDS}
        />
    );
}
