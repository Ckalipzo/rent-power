import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Eye, Download, DollarSign, X, CheckCircle, XCircle } from 'lucide-react';
import { Cliente, Cotizacion } from '../types/types';
import { DataTable } from './DataTable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CotizacionesViewerProps {
  clientes: Cliente[];
  onStatusChange?: (clienteId: string, cotizacionId: string, newStatus: 'aprobada' | 'rechazada' | 'pagada') => void;
}

export const CotizacionesViewer: React.FC<CotizacionesViewerProps> = ({
  clientes,
  onStatusChange
}) => {
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');

  // Verificar si una cotización está pagada
  const getCotizacionStatus = (cotizacion: Cotizacion) => {
    if (cotizacion.estado === 'pagada' || cotizacion.pagoId) {
      return 'pagada';
    }
    return cotizacion.estado;
  };

  // Obtener todas las cotizaciones de todos los clientes
  const allCotizaciones = clientes.flatMap(cliente => 
    (cliente.cotizaciones || []).map(cotizacion => ({
      ...cotizacion,
      clienteNombre: cliente.nombreEmpresa,
      clienteRFC: cliente.rfc,
      clienteId: cliente.id,
      estadoActual: getCotizacionStatus(cotizacion)
    }))
  );

  // Aplicar filtros
  const cotizacionesFiltradas = allCotizaciones.filter(cotizacion => {
    const cumpleEstado = filtroEstado === 'todas' || cotizacion.estadoActual === filtroEstado;
    const cumpleCliente = filtroCliente === 'todos' || cotizacion.clienteId === filtroCliente;
    return cumpleEstado && cumpleCliente;
  });

  const handleViewCotizacion = (cotizacion: Cotizacion, cliente: Cliente) => {
    setSelectedCotizacion(cotizacion);
    setSelectedCliente(cliente);
  };

  const exportarCotizacion = async () => {
    if (!selectedCotizacion || !selectedCliente) return;

    const content = document.getElementById('cotizacion-preview');
    if (!content) return;

    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cotizacion-${selectedCotizacion.id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Registro de Cotizaciones
          </h2>
          <div className="flex gap-4">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="todas">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="pagada">Pagadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombreEmpresa}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          data={cotizacionesFiltradas}
          columns={[
            {
              key: 'fecha',
              label: 'Fecha',
              render: (value) => format(new Date(value), 'dd/MM/yyyy')
            },
            {
              key: 'id',
              label: 'Folio',
              render: (value) => `#${value.slice(0, 8)}`
            },
            {
              key: 'clienteNombre',
              label: 'Cliente'
            },
            {
              key: 'clienteRFC',
              label: 'RFC'
            },
            {
              key: 'total',
              label: 'Total',
              render: (value) => `$${value.toFixed(2)}`
            },
            {
              key: 'estado',
              label: 'Estado',
              render: (value) => {
                const statusColors = {
                  pendiente: 'bg-yellow-100 text-yellow-800',
                  aprobada: 'bg-green-100 text-green-800',
                  rechazada: 'bg-red-100 text-red-800',
                  pagada: 'bg-blue-100 text-blue-800'
                };
                return (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                );
              }
            },
            {
              key: 'actions',
              label: 'Acciones',
              render: (_, row) => {
                const cliente = clientes.find(c => c.id === row.clienteId);
                if (!cliente) return null;
                
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewCotizacion(row, cliente)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Ver cotización"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {(row.estadoActual === 'pendiente' || row.estadoActual === 'aprobada') && !row.pagoId && onStatusChange && (
                      <>
                        <button
                          onClick={() => onStatusChange(row.clienteId, row.id, 'aprobada')}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Aprobar"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onStatusChange(row.clienteId, row.id, 'rechazada')}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Rechazar"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {row.estadoActual === 'aprobada' && !row.pagoId && onStatusChange && (
                      <button
                        onClick={() => onStatusChange(row.clienteId, row.id, 'pagada')}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Marcar como pagada"
                      >
                        <DollarSign className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                );
              }
            }
          ]}
          type="cotizaciones"
        />
      </div>

      {/* Modal de Vista Previa */}
      {selectedCotizacion && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6" id="cotizacion-preview">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">PowerRent</h2>
                  <p className="text-sm text-gray-500">Soluciones en Energía</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Cotización #{selectedCotizacion.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">{format(new Date(selectedCotizacion.fecha), 'dd/MM/yyyy')}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-medium">{selectedCliente.nombreEmpresa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RFC</p>
                    <p className="font-medium">{selectedCliente.rfc}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contacto</p>
                    <p className="font-medium">{selectedCliente.nombreContacto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedCliente.email}</p>
                  </div>
                </div>
              </div>

              <table className="w-full mb-6">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedCotizacion.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.descripcion}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.cantidad}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${item.precioUnitario.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${selectedCotizacion.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-medium">${selectedCotizacion.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-blue-600">${selectedCotizacion.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-600">
                  <p><strong>Vigencia:</strong> {selectedCotizacion.vigencia}</p>
                  <p className="mt-2"><strong>Notas:</strong> {selectedCotizacion.notas}</p>
                  <p className="mt-2"><strong>Estado:</strong> {getCotizacionStatus(selectedCotizacion).charAt(0).toUpperCase() + getCotizacionStatus(selectedCotizacion).slice(1)}</p>
                  {selectedCotizacion.pagoId && (
                    <p className="mt-2"><strong>Referencia de Pago:</strong> #{selectedCotizacion.pagoId.slice(0, 8)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4">
              <button
                onClick={() => setSelectedCotizacion(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
              <button
                onClick={exportarCotizacion}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};