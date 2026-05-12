import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';

export function EsValidacionesNormativasPage() {
    return (
        <section className="grid gap-4">
            <PageHeader
                title="Validaciones normativas"
                subtitle="Dictamen académico central: expedientes, solicitudes de matrícula, egresos, certificación e importaciones históricas cuando aplique."
            />
            <SectionCard title="Accesos operativos">
                <div className="flex flex-wrap gap-2">
                    <Link to="/app/documentos/validacion" className="inst-btn inst-btn-primary text-sm">
                        Validación documental / expediente
                    </Link>
                    <Link to="/app/importaciones" className="inst-btn inst-btn-secondary text-sm">
                        Importaciones académicas
                    </Link>
                    <Link to="/app/documentos/bandejas/pendientes-revision" className="inst-btn inst-btn-secondary text-sm">
                        Bandeja pendientes de revisión
                    </Link>
                </div>
            </SectionCard>
        </section>
    );
}
