import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { ES_INSTITUCIONES_REF } from '../../data/educacionSuperiorReference';

export function EsInstitucionesPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Instituciones"
                subtitle="Educación Normal y UPN: administración académica central. En catálogo operativo no se exponen campos legacy_rcve* ni rcvect como CCT."
            />
            <SectionCard title="Instituciones de referencia (Normal / UPN)">
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {ES_INSTITUCIONES_REF.map((n) => (
                        <li key={n}>{n}</li>
                    ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/app/admin/catalogos" className="inst-btn inst-btn-primary text-sm">
                        Abrir catálogos (instituciones)
                    </Link>
                    <Link to="/app/dashboard" className="inst-btn inst-btn-secondary text-sm">
                        Volver al tablero
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
