import React from 'react';
import { Download, Pencil, Trash2, FileText, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { format } from 'date-fns';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: Record<string, any>[];
  columns: Column[];
  type: 'clientes' | 'proveedores' | 'generadores' | 'rentas' | 'pagos' | 'notasCredito' | 'movimientos';
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: 'aprobada' | 'rechazada') => void;
  onMarkAsPaid?: (id: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data = [],
  columns = [],
  type,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onMarkAsPaid
}) => {
  const handleExport = () => {
    try {
      exportToExcel(data, type);
    } catch (error) {
      console.error(`Error al exportar datos:`, error);
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <div className="p-4 flex justify-between items-center border-b">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Download className="h-5 w-5" />
          Exportar a Excel
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Agregar Nuevo
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={`header-${column.key}`}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item.id || crypto.randomUUID()} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={`${item.id || crypto.randomUUID()}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item[column.key], item) : item[column.key] || '-'}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {type === 'cotizaciones' && item.estado === 'pendiente' && onStatusChange && (
                          <>
                            <button
                              onClick={() => onStatusChange(item.id, 'aprobada')}
                              className="text-green-600 hover:text-green-900"
                              title="Aprobar cotización"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => onStatusChange(item.id, 'rechazada')}
                              className="text-red-600 hover:text-red-900"
                              title="Rechazar cotización"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {type === 'cotizaciones' && item.estado === 'aprobada' && onMarkAsPaid && (
                          <button
                            onClick={() => onMarkAsPaid(item.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Marcar como pagada"
                          >
                            <DollarSign className="h-5 w-5" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  key="no-data-cell"
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};