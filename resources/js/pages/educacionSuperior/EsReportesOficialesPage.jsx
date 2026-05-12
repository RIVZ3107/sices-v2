import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { ES_REPORTES_OFICIALES_REF } from '../../data/educacionSuperiorReference';

export function EsReportesOficialesPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Reportes oficiales"
                subtitle="Concentrados SEP/institucionales para Normal y UPN. Sin becas ni infraestructura si no existen módulos formales vinculados."
            />
            <SectionCard title="Reportes previstos (referencia)">
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {ES_REPORTES_OFICIALES_REF.map((r) => (
                        <li key={r.clave}>{r.nombre}</li>
                    ))}
                </ul>
                <div className="mt-4">
                    <Link to="/app/admin/reportes-basicos" className="inst-btn inst-btn-primary text-sm">
                        Abrir vista de trabajo (911–919)
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
