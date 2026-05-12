import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { ES_CCTS_REF, ES_SEDES_REF } from '../../data/educacionSuperiorReference';

export function EsSedesPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Sedes / Subsedes"
                subtitle="El CCT oficial debe mostrarse desde el campo cct. Los identificadores legacy no sustituyen al CCT en vistas operativas."
            />
            <SectionCard title="Ejemplos de CCT oficiales">
                <p className="mb-2 font-mono text-sm text-slate-800">{ES_CCTS_REF.join(' · ')}</p>
            </SectionCard>
            <SectionCard title="Sedes / subsedes de referencia">
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {ES_SEDES_REF.map((n) => (
                        <li key={n}>{n}</li>
                    ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/app/admin/catalogos" className="inst-btn inst-btn-primary text-sm">
                        Abrir catálogos (sedes)
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
