import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';

export function EsCertificacionPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Certificación"
                subtitle="Supervisión y autorización de emisión. La ejecución técnica (XML, firma, colas) corresponde a Sistemas; aquí se dictamina y se envía a proceso técnico cuando corresponde."
            />
            <SectionCard title="Bandejas">
                <div className="flex flex-wrap gap-2">
                    <Link to="/app/documentos/bandejas/pendientes-revision" className="inst-btn inst-btn-primary text-sm">
                        Pendientes de revisión
                    </Link>
                    <Link to="/app/documentos/bandejas/aprobados" className="inst-btn inst-btn-secondary text-sm">
                        Documentos emitidos / aprobados
                    </Link>
                    <Link to="/app/documentos/bandejas/rechazados" className="inst-btn inst-btn-secondary text-sm">
                        Documentos observados
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
