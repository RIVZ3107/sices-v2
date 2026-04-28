import { Link } from 'react-router-dom';
import { EstadoBadge } from './EstadoBadge';
import { ObservacionesBadge } from './ObservacionesBadge';

export function BandejaTable({ rows = [] }) {
    return (
        <div className="overflow-x-auto inst-surface">
            <table className="inst-table min-w-full text-sm">
                <thead className="text-left">
                    <tr>
                        <th className="px-3 py-2">Folio</th>
                        <th className="px-3 py-2">Alumno</th>
                        <th className="px-3 py-2">CURP</th>
                        <th className="px-3 py-2">Institucion/Sede</th>
                        <th className="px-3 py-2">Ciclo</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Workflow</th>
                        <th className="px-3 py-2">Firma</th>
                        <th className="px-3 py-2">Observaciones</th>
                        <th className="px-3 py-2">Ultima observacion</th>
                        <th className="px-3 py-2">Listo firma</th>
                        <th className="px-3 py-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{row.folio_interno ?? `Doc #${row.id}`}</td>
                            <td className="px-3 py-2">{row.alumno?.nombre_completo ?? row.alumno?.nombre ?? 'N/A'}</td>
                            <td className="px-3 py-2">{row.alumno?.curp ?? '-'}</td>
                            <td className="px-3 py-2">{`${row.institucion_id ?? '-'} / ${row.sede_id ?? '-'}`}</td>
                            <td className="px-3 py-2">{row.ciclo_escolar_id ?? '-'}</td>
                            <td className="px-3 py-2">{row.tipo_documento ?? '-'}</td>
                            <td className="px-3 py-2"><EstadoBadge estado={row.estado_workflow} /></td>
                            <td className="px-3 py-2">{row.estado_firma ?? '-'}</td>
                            <td className="px-3 py-2">
                                <ObservacionesBadge
                                    pendientes={row.observaciones_pendientes_count ?? 0}
                                    total={row.observaciones_total_count ?? row.observaciones_count ?? 0}
                                />
                            </td>
                            <td className="px-3 py-2">{row.ultima_observacion?.observacion ?? '-'}</td>
                            <td className="px-3 py-2">{row.listo_para_firma ? 'Si' : 'No'}</td>
                            <td className="px-3 py-2">
                                <div className="flex gap-2">
                                    <Link to={`/app/documentos/${row.id}`} className="text-blue-700 hover:underline">Detalle</Link>
                                    <Link to={`/app/documentos/${row.id}/validacion`} className="text-blue-700 hover:underline">Validacion</Link>
                                    <Link to={`/app/documentos/${row.id}/observaciones`} className="text-blue-700 hover:underline">Observaciones</Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
