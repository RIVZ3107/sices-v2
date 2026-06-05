import { CATALOGOS_ACADEMICOS_TABS } from '../catalogosAcademicos/catalogosAcademicosConfig';

export const PROGRAMAS_OFERTAS_TABS = CATALOGOS_ACADEMICOS_TABS.filter(
    (t) => ['programas', 'planes', 'ofertas', 'estructura'].includes(t.id),
);

export const PROGRAMAS_OFERTAS_CARDS = [
    { key: 'programas_estudio', label: 'Programas', tab: 'programas' },
    { key: 'planes_estudio', label: 'Planes de estudio', tab: 'planes' },
    { key: 'ofertas_academicas', label: 'Ofertas académicas', tab: 'ofertas' },
    { key: 'plan_materias', label: 'Estructura curricular', tab: 'estructura' },
];
