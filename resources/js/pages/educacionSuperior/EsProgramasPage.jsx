import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { ES_PROGRAMAS_REF } from '../../data/educacionSuperiorReference';

export function EsProgramasPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Programas académicos"
                subtitle="Licenciaturas en educación (Normal / UPN). Sin carreras genéricas de otras áreas."
            />
            <SectionCard title="Programas válidos (referencia)">
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {ES_PROGRAMAS_REF.map((n) => (
                        <li key={n}>{n}</li>
                    ))}
                </ul>
                <div className="mt-4">
                    <Link to="/app/admin/catalogos" className="inst-btn inst-btn-primary text-sm">
                        Abrir catálogos (programas)
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
