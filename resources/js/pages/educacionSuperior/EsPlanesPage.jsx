import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';

export function EsPlanesPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Planes de estudio"
                subtitle="Versiones, vigencia y materias asociadas se administran desde catálogos académicos."
            />
            <SectionCard title="Acciones">
                <div className="flex flex-wrap gap-2">
                    <Link to="/app/admin/catalogos" className="inst-btn inst-btn-primary text-sm">
                        Abrir catálogos (planes)
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
