import { Link } from 'react-router-dom';
import { getUser } from '../authStore';
import { EstadoBadge } from './EstadoBadge';
import { ObservacionesBadge } from './ObservacionesBadge';

export function BandejaTable({ rows = [] }) {
    const isControlEscolar = (getUser()?.roles ?? []).includes('control_escolar_escuela');

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
                        {!isControlEscolar ? <th className="px-3 py-2">Firma</th> : null}
                        <th className="px-3 py-2">Observaciones</th>
                        <th className="px-3 py-2">Ultima observacion</th>
                        <th className="px-3 py-2">Listo firma</th>
                        <th className="px-3 py-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{row.folio_interno ?? 'Sin folio interno'}</td>
                            <td className="px-3 py-2">{row.alumno?.nombre_completo ?? row.alumno?.nombre ?? 'Sin nombre registrado'}</td>
                            <td className="px-3 py-2">{row.alumno?.curp ?? '-'}</td>
                            <td className="px-3 py-2">{`${row.institucion?.nombre ?? 'Institución asignada'} / ${row.sede?.nombre ?? row.sede?.clave ?? 'Sede/CCT asignada'}`}</td>
                            <td className="px-3 py-2">{row.ciclo_escolar?.nombre ?? row.ciclo_escolar?.clave ?? 'Ciclo institucional'}</td>
                            <td className="px-3 py-2">{row.tipo_documento ?? '-'}</td>
                            <td className="px-3 py-2"><EstadoBadge estado={row.estado_workflow} /></td>
                            {!isControlEscolar ? <td className="px-3 py-2">{row.estado_firma ?? '-'}</td> : null}
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
                                    <Link to={`/app/expedientes?alumno=${row.alumno?.id ?? ''}&tab=certificacion`} className="text-blue-700 hover:underline">Abrir expediente</Link>
                                    <Link to={`/app/documentos/${row.id}/observaciones`} className="text-blue-700 hover:underline">Atender observación</Link>
                                    <Link to={`/app/documentos/${row.id}`} className="text-blue-700 hover:underline">Ver seguimiento</Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
