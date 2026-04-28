import { PageHeader } from '../../components/ui/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';

export function AuditoriaPage() {
    return (
        <section className="grid gap-4">
            <PageHeader title="Auditoria" subtitle="Trazabilidad de acciones operativas del sistema." />
            <SectionCard title="Modulo de auditoria en preparacion">
                <p className="text-sm text-slate-600">La vista de auditoria estara disponible al publicarse endpoints de bitacora y eventos.</p>
            </SectionCard>
        </section>
    );
}
